'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface UniformOrder {
  id: number
  status: string
  estimated_revenue: number
  opportunity: {
    name: string
  }
}

export default function UniformOrdersPage() {
  const [orders, setOrders] = useState<UniformOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      try {
        // Note: The API for fetching all uniform orders doesn't exist yet.
        // We are simulating the data for now.
        setOrders([
          {
            id: 1,
            status: 'Pending',
            estimated_revenue: 3500,
            opportunity: {
              name: 'Varsity Football Uniforms'
            }
          }
        ])
      } catch (error) {
        console.error('Failed to fetch uniform orders', error)
      }
      setLoading(false)
    }
    fetchOrders()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Uniform Orders</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <CardTitle>{order.opportunity.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Status: {order.status}</p>
                <p>Value: ${order.estimated_revenue}</p>
                <Link href={`/uniform-orders/${order.id}`} className="text-blue-500 hover:underline mt-4 block">
                  View Details
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
