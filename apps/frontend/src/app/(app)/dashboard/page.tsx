'use client'

import { useData } from '@/hooks/useData'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface DashboardData {
  pipeline: Array<{ stage: string; _count: { id: number } }>
  totalRevenue: number
  directorData?: {
    totalCost: number
    grossMargin: string
  }
}

// This component is now client-side and uses a hook to fetch data
export default function DashboardPage() {
  const { data, isLoading, error } = useData<DashboardData>('/api/dashboard')

  if (isLoading) return <p>Loading...</p>
  if (error) return <p>Error loading dashboard.</p>
  if (!data) return <p>No data available.</p>

  const { pipeline, totalRevenue, directorData } = data

  return (
    <main className="p-6" data-testid="page-dashboard">

      <p>Welcome, you are logged in.</p>

      <div className="mt-6">
        <h3 className="text-lg font-medium">Sales Pipeline</h3>
        {pipeline.length > 0 ? (
          <ul>
            {pipeline.map((p: any) => (
              <li key={p.stage}>
                {p.stage}: {p._count.id}
              </li>
            ))}
          </ul>
        ) : (
          <p>No opportunities in the pipeline.</p>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-medium">Total Revenue</h3>
        <p>${totalRevenue.toLocaleString()}</p>
      </div>

      {directorData && (
        <div className="mt-6">
          <h3 className="text-lg font-medium">Director Insights</h3>
          <p>Total Cost: ${directorData.totalCost.toLocaleString()}</p>
          <p>Gross Margin: {directorData.grossMargin}</p>
        </div>
      )}
    </main>
  )
}
