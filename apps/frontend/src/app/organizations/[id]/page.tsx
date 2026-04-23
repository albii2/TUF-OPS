'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Organization {
  id: number
  name: string
  zoho_account_id: string
}

export default function OrganizationDetailsPage() {
  const params = useParams()
  const id = params.id
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      async function fetchOrganization() {
        setLoading(true)
        try {
          const response = await fetch(`/api/organizations/${id}`)
          if (response.ok) {
            const data = await response.json()
            setOrganization(data)
          } else {
            console.error('Failed to fetch organization')
          }
        } catch (error) {
          console.error('Failed to fetch organization', error)
        }
        setLoading(false)
      }
      fetchOrganization()
    }
  }, [id])

  if (loading) return <p>Loading...</p>
  if (!organization) return <p>Organization not found.</p>

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{organization.name}</h1>
        <Link href={`/organizations/${id}/edit`} data-testid="edit-organization-link">
          <Button>Edit Organization</Button>
        </Link>
      </div>
      <p>Zoho ID: {organization.zoho_account_id}</p>
    </div>
  )
}
