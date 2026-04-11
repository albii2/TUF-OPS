'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface UniformOrder {
  id: number
  status: 'pending' | 'ready_for_ops' | 'completed' | 'blocked'
  estimatedRevenue: number
  opportunityName: string
  organizationName: string
  ownerName: string
}

export default function UniformOrdersPage() {
  const [orders, setOrders] = useState<UniformOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch('/api/uniform-orders')

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload.error ?? 'Failed to fetch orders')
        }

        const payload = await response.json()
        setOrders(payload.orders ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch uniform orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-6 text-3xl font-bold">Uniform Orders</h1>

      {loading ? <p>Loading...</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}

      {!loading && !error ? (
        orders.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <CardTitle>{order.opportunityName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Organization: {order.organizationName}</p>
                  <p>Owner: {order.ownerName}</p>
                  <p>Status: {order.status}</p>
                  <p>Value: ${order.estimatedRevenue.toFixed(2)}</p>
                  <Link href={`/uniform-orders/${order.id}`} className="mt-4 block text-blue-500 hover:underline">
                    View Details
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p>No active uniform orders yet. Move an opportunity into invoice stage to create one.</p>
        )
      ) : null}
    </div>
  )
}
