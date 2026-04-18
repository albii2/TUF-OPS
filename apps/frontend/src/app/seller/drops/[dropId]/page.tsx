import { OrderStatus } from '@prisma/client'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { notFound } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireSellerSession } from '@/lib/kickz/auth'
import { getDropControlPanel } from '@/lib/kickz/data'
import { formatCurrency, formatOrderStatus, toNumber } from '@/lib/kickz/format'
import { prisma } from '@/lib/prisma'

async function updateOrderStatus(formData: FormData) {
  'use server'

  await requireSellerSession()

  const orderId = Number(formData.get('orderId'))
  const dropId = Number(formData.get('dropId'))
  const status = String(formData.get('status')) as OrderStatus

  if (!orderId || !dropId || !status) return
  if (!['fulfilled', 'refunded'].includes(status)) return

  await prisma.order.update({ where: { id: orderId }, data: { status } })
  revalidatePath(`/seller/drops/${dropId}`)
}

async function releaseReservedPair(formData: FormData) {
  'use server'

  await requireSellerSession()

  const orderId = Number(formData.get('orderId'))
  const dropId = Number(formData.get('dropId'))
  const sizeLabel = String(formData.get('sizeLabel') ?? '')
  if (!orderId || !dropId || !sizeLabel) return

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } })
    if (!order || !['deposit_paid', 'overdue'].includes(order.status)) return

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    })

    const dropSize = await tx.dropSize.findUnique({
      where: { dropId_sizeLabel: { dropId, sizeLabel } },
      select: { reservedInventory: true },
    })
    if (!dropSize || dropSize.reservedInventory < 1) return

    await tx.dropSize.update({
      where: { dropId_sizeLabel: { dropId, sizeLabel } },
      data: {
        reservedInventory: {
          decrement: 1,
        },
      },
    })
  })

  revalidatePath(`/seller/drops/${dropId}`)
}

const statusOptions: OrderStatus[] = ['fulfilled', 'refunded']

export default async function SellerDropControlPanelPage({ params }: { params: Promise<{ dropId: string }> }) {
  await requireSellerSession()

  const { dropId } = await params
  const parsedDropId = Number(dropId)
  if (!Number.isFinite(parsedDropId)) notFound()
  const drop = await getDropControlPanel(parsedDropId)

  const collected = drop.orders.reduce(
    (sum, order) => sum + order.payments.reduce((paymentSum, payment) => paymentSum + toNumber(payment.amount), 0),
    0,
  )
  const outstanding = drop.orders
    .filter((order) => ['deposit_paid', 'overdue'].includes(order.status))
    .reduce((sum, order) => sum + toNumber(order.balanceOwed), 0)
  const activeOrders = drop.orders.filter((order) => ['deposit_paid', 'overdue', 'paid_in_full'].includes(order.status)).length

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-neutral-400">Control Panel</p>
            <h1 className="text-2xl font-semibold">{drop.title}</h1>
            <p className="text-sm text-neutral-400">Release {new Date(drop.releaseAt).toLocaleString()}</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/seller/calendar">Back to Calendar</Link>
          </Button>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Collected" value={formatCurrency(collected)} />
          <StatCard label="Outstanding" value={formatCurrency(outstanding)} />
          <StatCard label="Active Orders" value={String(activeOrders)} />
          <StatCard
            label="Inventory (Avail)"
            value={String(drop.sizes.reduce((sum, size) => sum + size.totalInventory - size.reservedInventory - size.soldInventory, 0))}
          />
        </section>

        <Card className="border-neutral-800 bg-neutral-900">
          <CardHeader>
            <CardTitle>Inventory by size</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {drop.sizes.map((size) => (
              <div key={size.id} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
                <p className="text-xs text-neutral-400">US {size.sizeLabel}</p>
                <p className="text-lg font-semibold">{size.totalInventory - size.reservedInventory - size.soldInventory} left</p>
                <p className="text-xs text-neutral-500">{size.reservedInventory} locked · {size.soldInventory} sold</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900">
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>Manage payment and fulfillment state.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {drop.orders.map((order) => (
              <article key={order.id} className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{order.customer.fullName}</p>
                    <p className="text-xs text-neutral-400">{order.customer.email}</p>
                  </div>
                  <Badge className="capitalize">{formatOrderStatus(order.status)}</Badge>
                </div>
                <p className="text-sm text-neutral-300">
                  Size US {order.sizeLabel} · Paid {formatCurrency(toNumber(order.depositPaid))} · Owes{' '}
                  {formatCurrency(toNumber(order.balanceOwed))}
                </p>
                <p className="mt-1 text-xs text-neutral-500">Balance due {new Date(order.balanceDueAt).toLocaleString()}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <form action={updateOrderStatus} className="flex items-center gap-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="dropId" value={drop.id} />
                    <select
                      name="status"
                      defaultValue={statusOptions.includes(order.status) ? order.status : 'fulfilled'}
                      className="rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm"
                    >
                      {statusOptions.map((status) => (
                        <option value={status} key={status}>
                          {formatOrderStatus(status)}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" variant="secondary">
                      Update
                    </Button>
                  </form>
                  <form action={releaseReservedPair}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="dropId" value={drop.id} />
                    <input type="hidden" name="sizeLabel" value={order.sizeLabel} />
                    <Button size="sm" variant="destructive" disabled={!['deposit_paid', 'overdue'].includes(order.status)}>
                      Release Pair
                    </Button>
                  </form>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/orders/${order.publicOrderId}`}>Open Public Status</Link>
                  </Button>
                </div>
              </article>
            ))}
            {drop.orders.length === 0 ? <p className="text-sm text-neutral-400">No orders yet.</p> : null}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-neutral-800 bg-neutral-900">
      <CardContent className="space-y-1 py-4">
        <p className="text-xs uppercase tracking-wider text-neutral-400">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}
