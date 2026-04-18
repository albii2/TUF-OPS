import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getDropBySlug } from '@/lib/kickz/data'
import { formatCurrency } from '@/lib/kickz/format'

export default async function CustomerDropPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const drop = await getDropBySlug(slug)

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 to-black px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-neutral-400">KICKZ DROP SYSTEM</p>
          <h1 className="text-3xl font-semibold leading-tight">{drop.title}</h1>
          <p className="text-neutral-300">{drop.description}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Balance due {new Date(drop.balanceDueAt).toLocaleDateString()}</Badge>
            <Badge variant="secondary">Release {new Date(drop.releaseAt).toLocaleDateString()}</Badge>
            <Badge variant="outline">Deposit {formatCurrency(Number(drop.depositAmount))}</Badge>
            <Badge variant="outline">Total {formatCurrency(Number(drop.fullPrice))}</Badge>
          </div>
        </div>

        {drop.heroImageUrl ? (
          <div className="overflow-hidden rounded-2xl border border-neutral-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={drop.heroImageUrl} alt={drop.title} className="h-64 w-full object-cover" />
          </div>
        ) : null}

        <Card className="border-neutral-800 bg-neutral-900">
          <CardContent className="space-y-4 py-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Choose your size</h2>
              <p className="text-xs text-neutral-400">Only available sizes can be locked.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {drop.sizes.map((size) => {
                const available = size.totalInventory - size.reservedInventory - size.soldInventory
                return (
                  <div key={size.id} className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-950 p-3">
                    <p className="text-lg font-medium">US {size.sizeLabel}</p>
                    <p className="text-xs text-neutral-400">{available > 0 ? `${available} left` : 'Sold out'}</p>
                    <Button asChild disabled={available <= 0} className="w-full" size="sm">
                      <Link href={`/drops/${drop.slug}/checkout?size=${encodeURIComponent(size.sizeLabel)}`}>
                        {available > 0 ? 'Lock Size' : 'Unavailable'}
                      </Link>
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
