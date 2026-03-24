'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NewOrganizationPage() {
  console.log('Rendering NewOrganizationPage');
  const [name, setName] = useState('')
  const [zohoAccountId, setZohoAccountId] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, zoho_account_id: zohoAccountId }),
        credentials: 'include'
      })

      if (response.ok) {
        router.push('/organizations?refresh=true')
      } else {
        console.error('Failed to create organization')
      }
    } catch (error) {
      console.error('Failed to create organization', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10" data-testid="page-organization-new">
      <h1 className="text-3xl font-bold mb-6">Create Organization</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <Label htmlFor="name">Organization Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            data-testid="input-organization-name"
          />
        </div>
        <div>
          <Label htmlFor="zohoAccountId">Zoho Account ID</Label>
          <Input
            id="zohoAccountId"
            value={zohoAccountId}
            onChange={(e) => setZohoAccountId(e.target.value)}
            data-testid="input-organization-zoho_account_id"
          />
        </div>
        <Button type="submit" disabled={loading} data-testid="submit-organization">
          {loading ? 'Creating...' : 'Create Organization'}
        </Button>
      </form>
    </div>
  )
}
