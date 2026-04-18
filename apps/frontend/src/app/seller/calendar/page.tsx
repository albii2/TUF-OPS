import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requireSellerSession } from '@/lib/kickz/auth'
import { ACTIVE_ORDER_STATUSES } from '@/lib/kickz/data'
import { formatCurrency, toNumber } from '@/lib/kickz/format'
import { prisma } from '@/lib/prisma'

export default async function SellerCalendarPage() {
  await requireSellerSession()

  const drops = await prisma.drop.findMany({
    include: {
      sizes: true,
      orders: true,
    },
    orderBy: { releaseAt: 'asc' },
  })

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-neutral-400">Seller</p>
            <h1 className="text-2xl font-semibold">Release Calendar</h1>
          </div>
          <Button asChild>
            <Link href="/seller/drops/new">Create Drop</Link>
          </Button>
        </div>

        <div className="grid gap-4">
          {drops.map((drop) => {
            const orderedPairs = drop.orders.length
            const inventory = drop.sizes.reduce((acc, size) => acc + size.totalInventory, 0)
            const locked = drop.sizes.reduce((acc, size) => acc + size.reservedInventory, 0)
            const sold = drop.sizes.reduce((acc, size) => acc + size.soldInventory, 0)
            const activeOrders = drop.orders.filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status)).length
            const collected = drop.orders.reduce((acc, order) => acc + toNumber(order.depositPaid), 0)

            return (
              <Card key={drop.id} className="border-neutral-800 bg-neutral-900">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2 text-lg">
                    {drop.title}
                    <Badge variant="secondary">{new Date(drop.releaseAt).toLocaleDateString()}</Badge>
                  </CardTitle>
                  <CardDescription>{drop.description ?? 'No description added'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-neutral-200">
                  <div className="flex flex-wrap gap-3">
                    <span>Total inventory: {inventory}</span>
                    <span>Orders: {orderedPairs}</span>
                    <span>Active: {activeOrders}</span>
                    <span>Locked: {locked}</span>
                    <span>Sold: {sold}</span>
                    <span>Collected: {formatCurrency(collected)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/seller/drops/${drop.id}`}>Open Control Panel</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/drops/${drop.slug}`}>View Customer Page</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {drops.length === 0 ? (
            <Card className="border-dashed border-neutral-800 bg-neutral-900">
              <CardContent className="py-8 text-center text-neutral-300">No drops yet. Create your first release.</CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </main>
  )
}
