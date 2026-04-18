import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getOrderByPublicId } from '@/lib/kickz/data'
import { formatCurrency } from '@/lib/kickz/format'

export default async function CustomerConfirmationPage({
  params,
}: {
  params: Promise<{ publicOrderId: string }>
}) {
  const { publicOrderId } = await params
  const order = await getOrderByPublicId(publicOrderId)

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-xl space-y-4">
        <p className="text-xs uppercase tracking-[0.28em] text-emerald-400">Deposit Confirmed</p>
        <h1 className="text-3xl font-semibold">Your pair is locked 🔒</h1>
        <Card className="border-neutral-800 bg-neutral-900">
          <CardHeader>
            <CardTitle>Order {order.publicOrderId}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-neutral-200">
            <p>{order.drop.title}</p>
            <p>Size: US {order.sizeLabel}</p>
            <p>Paid now: {formatCurrency(Number(order.depositPaid))}</p>
            <p>Balance due: {formatCurrency(Number(order.balanceOwed))}</p>
            <p>Balance due by: {new Date(order.balanceDueAt).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Button asChild className="w-full">
          <Link href={`/orders/${order.publicOrderId}`}>Track Order Status</Link>
        </Button>
      </div>
    </main>
  )
}
