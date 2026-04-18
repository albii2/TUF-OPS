import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getDropBySlug } from '@/lib/kickz/data'
import { formatCurrency } from '@/lib/kickz/format'
import { prisma } from '@/lib/prisma'

function generatePublicOrderId() {
  return `KZ-${Math.random().toString(36).slice(2, 8).toUpperCase()}${Date.now().toString().slice(-4)}`
}

async function createOrder(formData: FormData) {
  'use server'

  const dropId = Number(formData.get('dropId'))
  const slug = String(formData.get('slug'))
  const sizeLabel = String(formData.get('sizeLabel'))
  const fullName = String(formData.get('fullName') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const phone = String(formData.get('phone') ?? '').trim()

  if (!dropId || !slug || !sizeLabel || !fullName || !email) {
    redirect(`/drops/${slug}/checkout?size=${encodeURIComponent(sizeLabel)}&error=1`)
  }

  const createdOrder = await prisma.$transaction(async (tx) => {
    const drop = await tx.drop.findUnique({ where: { id: dropId } })
    const size = await tx.dropSize.findUnique({
      where: {
        dropId_sizeLabel: { dropId, sizeLabel },
      },
    })

    if (!drop || !size || size.reservedInventory + size.soldInventory >= size.totalInventory) {
      return null
    }

    const customer = await tx.customer.create({
      data: {
        fullName,
        email,
        phone: phone || null,
      },
    })

    const deposit = Number(drop.depositAmount)
    const unitPrice = Number(drop.fullPrice)
    const balanceOwed = Math.max(unitPrice - deposit, 0)

    const order = await tx.order.create({
      data: {
        publicOrderId: generatePublicOrderId(),
        dropId,
        customerId: customer.id,
        sizeLabel,
        quantity: 1,
        unitPrice,
        depositPaid: deposit,
        balanceOwed,
        balanceDueAt: drop.balanceDueAt,
        status: 'deposit_paid',
      },
    })

    await tx.payment.create({
      data: {
        orderId: order.id,
        amount: deposit,
        paymentType: 'deposit',
        status: 'succeeded',
        paymentMethodRef: 'simulated-card',
      },
    })

    await tx.dropSize.update({
      where: {
        dropId_sizeLabel: { dropId, sizeLabel },
      },
      data: {
        reservedInventory: {
          increment: 1,
        },
      },
    })

    return order
  })

  if (!createdOrder) {
    redirect(`/drops/${slug}?soldout=1`)
  }

  revalidatePath(`/drops/${slug}`)
  revalidatePath(`/seller/drops/${dropId}`)
  redirect(`/orders/${createdOrder.publicOrderId}/confirmation`)
}

export default async function CustomerCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ size?: string; error?: string }>
}) {
  const { slug } = await params
  const query = await searchParams
  const drop = await getDropBySlug(slug)

  const requestedSize = query.size ?? ''
  const size = drop.sizes.find((item) => item.sizeLabel === requestedSize)

  if (!size || size.reservedInventory + size.soldInventory >= size.totalInventory) {
    redirect(`/drops/${slug}`)
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-xl space-y-5">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-neutral-400">Checkout</p>
          <h1 className="text-2xl font-semibold">{drop.title}</h1>
          <p className="text-neutral-400">Secure size US {size.sizeLabel} with deposit.</p>
        </div>

        <Card className="border-neutral-800 bg-neutral-900">
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
            <CardDescription>Deposit is charged now. Remaining balance is due before delivery.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-neutral-200">
            <div className="flex justify-between">
              <span>Deposit due now</span>
              <span>{formatCurrency(Number(drop.depositAmount))}</span>
            </div>
            <div className="flex justify-between">
              <span>Total pair price</span>
              <span>{formatCurrency(Number(drop.fullPrice))}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Balance after deposit</span>
              <span>{formatCurrency(Number(drop.fullPrice) - Number(drop.depositAmount))}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900">
          <CardContent className="py-5">
            <form action={createOrder} className="space-y-4">
              <input type="hidden" name="dropId" value={drop.id} />
              <input type="hidden" name="slug" value={drop.slug} />
              <input type="hidden" name="sizeLabel" value={size.sizeLabel} />

              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" name="fullName" required className="bg-neutral-950" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" name="email" required className="bg-neutral-950" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" name="phone" className="bg-neutral-950" />
              </div>
              {query.error ? <p className="text-sm text-red-400">Please provide required details.</p> : null}
              <Button className="w-full">Pay Deposit & Lock Size</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
