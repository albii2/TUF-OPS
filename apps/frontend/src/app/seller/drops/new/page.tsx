import { redirect } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { requireSellerSession } from '@/lib/kickz/auth'
import { prisma } from '@/lib/prisma'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function parseSizes(raw: string) {
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [sizeLabel, qty] = entry.split(':').map((v) => v.trim())
      const totalInventory = Number(qty)
      return { sizeLabel, totalInventory }
    })
    .filter((size) => size.sizeLabel && Number.isFinite(size.totalInventory) && size.totalInventory > 0)
}

async function createDrop(formData: FormData) {
  'use server'

  await requireSellerSession()

  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const releaseAt = String(formData.get('releaseAt') ?? '')
  const balanceDueAt = String(formData.get('balanceDueAt') ?? '')
  const depositOpensAt = String(formData.get('depositOpensAt') ?? '')
  const depositAmount = Number(formData.get('depositAmount') ?? 0)
  const fullPrice = Number(formData.get('fullPrice') ?? 0)
  const heroImageUrl = String(formData.get('heroImageUrl') ?? '').trim()
  const sizeInventory = parseSizes(String(formData.get('sizeInventory') ?? ''))

  if (!title || !releaseAt || !balanceDueAt || sizeInventory.length === 0) {
    redirect('/seller/drops/new?error=1')
  }

  const drop = await prisma.drop.create({
    data: {
      title,
      slug: slugify(title),
      description: description || null,
      depositOpensAt: depositOpensAt ? new Date(depositOpensAt) : null,
      balanceDueAt: new Date(balanceDueAt),
      releaseAt: new Date(releaseAt),
      depositAmount,
      fullPrice,
      heroImageUrl: heroImageUrl || null,
      sizes: {
        create: sizeInventory,
      },
    },
  })

  redirect(`/seller/drops/${drop.id}`)
}

export default async function SellerCreateDropPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  await requireSellerSession()
  const params = await searchParams

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-white">
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-neutral-400">Seller</p>
          <h1 className="text-2xl font-semibold">Create Drop</h1>
        </div>
        <Card className="border-neutral-800 bg-neutral-900">
          <CardHeader>
            <CardTitle>Drop details</CardTitle>
            <CardDescription>Launch quickly with key fields for preorder management.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createDrop} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Drop name</Label>
                <Input id="title" name="title" placeholder="Air Jordan 4 Retro Black Cat" required className="bg-neutral-950" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Premium pair. Limited allocations." className="bg-neutral-950" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="depositOpensAt">Deposit opens (optional)</Label>
                  <Input id="depositOpensAt" name="depositOpensAt" type="datetime-local" className="bg-neutral-950" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="releaseAt">Release date/time</Label>
                  <Input id="releaseAt" name="releaseAt" type="datetime-local" required className="bg-neutral-950" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="balanceDueAt">Balance due date/time</Label>
                  <Input id="balanceDueAt" name="balanceDueAt" type="datetime-local" required className="bg-neutral-950" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroImageUrl">Hero image URL</Label>
                  <Input id="heroImageUrl" name="heroImageUrl" placeholder="https://..." className="bg-neutral-950" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Deposit amount (USD)</Label>
                  <Input id="depositAmount" name="depositAmount" type="number" min="1" step="0.01" required className="bg-neutral-950" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullPrice">Full price (USD)</Label>
                  <Input id="fullPrice" name="fullPrice" type="number" min="1" step="0.01" required className="bg-neutral-950" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sizeInventory">Size inventory map</Label>
                <Textarea
                  id="sizeInventory"
                  name="sizeInventory"
                  placeholder="8:3, 8.5:2, 9:4, 10:3"
                  required
                  className="bg-neutral-950"
                />
                <p className="text-xs text-neutral-400">Format: size:qty, comma separated.</p>
              </div>
              {params.error ? <p className="text-sm text-red-400">Please complete all required fields.</p> : null}
              <Button className="w-full">Create Drop</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
