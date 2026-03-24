'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Opportunity {
  id: number
  name: string
  stage: string
  estimated_value: number | null
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOpportunities() {
      setLoading(true)
      try {
        const response = await fetch('/api/opportunities')
        if (response.ok) {
          const data = await response.json()
          setOpportunities(data.opportunities)
        } else {
          console.error('Failed to fetch opportunities')
        }
      } catch (error) {
        console.error('Failed to fetch opportunities', error)
      }
      setLoading(false)
    }
    fetchOpportunities()
  }, [])

  if (loading) {
    return <p>Loading opportunities...</p>
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Opportunities</h1>
        <Link href="/opportunities/new">
          <Button>Create Opportunity</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {opportunities.map(opp => (
          <div key={opp.id} className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold">{opp.name}</h2>
            <p>Stage: {opp.stage}</p>
            <p>Value: ${opp.estimated_value?.toLocaleString() || 'N/A'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
