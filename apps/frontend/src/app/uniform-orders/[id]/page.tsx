'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface UniformOrder {
  id: number
  status: string
  estimated_revenue: number
  opportunity: {
    id: number;
    name: string;
  };
  roster_uploads: any[]; // Placeholder
}

export default function UniformOrderDetailPage() {
  const [order, setOrder] = useState<UniformOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const id = params.id

  useEffect(() => {
    async function fetchOrder() {
      if (!id) return
      try {
        // NOTE: The API route for fetching a single uniform order doesn't exist yet.
        // This is a placeholder for where that logic would go.
        setOrder({
          id: 1,
          status: 'Pending',
          estimated_revenue: 3500,
          opportunity: {
            id: 1,
            name: 'Varsity Football Uniforms'
          },
          roster_uploads: []
        });
      } catch (error) {
        console.error('Failed to fetch uniform order', error)
      }
      setLoading(false)
    }
    fetchOrder()
  }, [id])

  if (loading) {
    return <p>Loading...</p>
  }

  if (!order) {
    return <p>Order not found</p>
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-2">Order for {order.opportunity.name}</h1>
      <p className="text-xl text-gray-500 mb-6">Status: {order.status}</p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Roster</CardTitle>
          </CardHeader>
          <CardContent>
            <Button>Upload Roster</Button>
            {/* Roster display will go here */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Order items will go here */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
