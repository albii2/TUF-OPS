import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getOrderByPublicId } from '@/lib/kickz/data'
import { formatCurrency, formatOrderStatus, toNumber } from '@/lib/kickz/format'
import { prisma } from '@/lib/prisma'

async function payBalance(formData: FormData) {
  'use server'

  const orderId = Number(formData.get('orderId'))
  const publicOrderId = String(formData.get('publicOrderId') ?? '')
  if (!orderId || !publicOrderId) return

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { drop: true },
    })
    if (!order || order.balanceOwed.lte(0) || ['cancelled', 'refunded'].includes(order.status)) return

    const remainingBalance = toNumber(order.balanceOwed)

    await tx.payment.create({
      data: {
        orderId: order.id,
        amount: remainingBalance,
        paymentType: 'balance',
        status: 'succeeded',
        paymentMethodRef: 'simulated-card',
      },
    })

    await tx.order.update({
      where: { id: order.id },
      data: {
        depositPaid: {
          increment: remainingBalance,
        },
        balanceOwed: 0,
        status: 'paid_in_full',
        paidInFullAt: new Date(),
      },
    })

    const dropSize = await tx.dropSize.findUnique({
      where: {
        dropId_sizeLabel: { dropId: order.dropId, sizeLabel: order.sizeLabel },
      },
      select: { reservedInventory: true },
    })
    if (!dropSize || dropSize.reservedInventory < 1) return

    await tx.dropSize.update({
      where: {
        dropId_sizeLabel: { dropId: order.dropId, sizeLabel: order.sizeLabel },
      },
      data: {
        reservedInventory: { decrement: 1 },
        soldInventory: { increment: 1 },
      },
    })
  })

  revalidatePath(`/orders/${publicOrderId}`)
  redirect(`/orders/${publicOrderId}`)
}

export default async function CustomerOrderStatusPage({
  params,
}: {
  params: Promise<{ publicOrderId: string }>
}) {
  const { publicOrderId } = await params
  const order = await getOrderByPublicId(publicOrderId)

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-neutral-400">Order Tracking</p>
          <h1 className="text-2xl font-semibold">{order.publicOrderId}</h1>
          <p className="text-neutral-400">{order.drop.title}</p>
        </div>

        <Card className="border-neutral-800 bg-neutral-900">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Status
              <Badge className="capitalize">{formatOrderStatus(order.status)}</Badge>
            </CardTitle>
            <CardDescription>Size US {order.sizeLabel}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-neutral-200">
            <div className="flex justify-between">
              <span>Amount paid</span>
              <span>{formatCurrency(toNumber(order.depositPaid))}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount owed</span>
              <span>{formatCurrency(toNumber(order.balanceOwed))}</span>
            </div>
            <div className="flex justify-between">
              <span>Total pair price</span>
              <span>{formatCurrency(toNumber(order.unitPrice))}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Balance due by</span>
              <span>{new Date(order.balanceDueAt).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {toNumber(order.balanceOwed) > 0 && !['cancelled', 'refunded'].includes(order.status) ? (
          <Card className="border-neutral-800 bg-neutral-900">
            <CardHeader>
              <CardTitle>Complete Balance Payment</CardTitle>
              <CardDescription>Pay the remaining amount to secure this pair for release day.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={payBalance}>
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="publicOrderId" value={order.publicOrderId} />
                <Button className="w-full">Pay {formatCurrency(toNumber(order.balanceOwed))}</Button>
              </form>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-neutral-800 bg-neutral-900">
          <CardHeader>
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {order.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between rounded-md border border-neutral-800 px-3 py-2">
                <span className="capitalize text-neutral-300">{payment.paymentType} payment</span>
                <span>{formatCurrency(toNumber(payment.amount))}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button asChild variant="outline" className="w-full">
          <Link href={`/drops/${order.drop.slug}`}>Back to Drop</Link>
        </Button>
      </div>
    </main>
  )
}
