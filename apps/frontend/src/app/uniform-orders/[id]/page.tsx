'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface UniformOrder {
  id: number
  status: 'pending' | 'ready_for_ops' | 'completed' | 'blocked'
  estimatedRevenue: number
  opportunityName: string
  organizationName: string
  ownerName: string
  nextStep?: string | null
  stage: string
}

export default function UniformOrderDetailPage() {
  const [order, setOrder] = useState<UniformOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const id = params.id

  useEffect(() => {
    async function fetchOrder() {
      if (!id) return

      try {
        const response = await fetch(`/api/uniform-orders/${id}`)

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload.error ?? 'Failed to fetch order')
        }

        const payload = await response.json()
        setOrder(payload.order ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch uniform order')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id])

  if (loading) return <p>Loading...</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!order) return <p>Order not found.</p>

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-2 text-3xl font-bold">Order for {order.opportunityName}</h1>
      <p className="mb-6 text-xl text-gray-500">Status: {order.status}</p>

      <div className="mb-6 rounded border p-4">
        <p>Organization: {order.organizationName}</p>
        <p>Owner: {order.ownerName}</p>
        <p>Value: ${order.estimatedRevenue.toFixed(2)}</p>
        <p>Current Stage: {order.stage}</p>
        <p>Next Step: {order.nextStep || 'Not set'}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Roster</CardTitle>
          </CardHeader>
          <CardContent>
            <Button disabled>Roster Upload (Coming next)</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No items captured yet.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
