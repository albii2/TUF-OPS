'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface Organization {
  id: number
  name: string
  zoho_account_id: string
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10
  const router = useRouter()

  useEffect(() => {
    router.refresh()
    async function fetchOrganizations() {
      setLoading(true)
      try {
        const response = await fetch(`/api/organizations?page=${page}&limit=${limit}`)
        if (response.ok) {
          const data = await response.json()
          setOrganizations(data.organizations)
          setTotal(data.total)
        }
      } catch (error) {
        console.error('Failed to fetch organizations', error)
      }
      setLoading(false)
    }
    fetchOrganizations()
  }, [page, router])

  return (
    <div className="container mx-auto py-10" data-testid="page-organizations">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Organizations</h1>
        <Link href="/organizations/new" data-testid="create-organization-link">
          <Button>Create Organization</Button>
        </Link>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card key={org.id} data-testid={`organization-row-${org.id}`}>
              <CardHeader>
                <CardTitle>
                  <Link href={`/organizations/${org.id}`} className="hover:underline">
                    {org.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Zoho ID: {org.zoho_account_id}</p>
                <Link href={`/organizations/${org.id}`} className="text-blue-500 hover:underline mt-4 block">
                  View Details
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-center items-center space-x-2 mt-8">
        <Button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>
          Page {page} of {Math.ceil(total / limit)}
        </span>
        <Button
          onClick={() => setPage(page + 1)}
          disabled={page * limit >= total}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
