'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { OPPORTUNITY_STAGES, OPPORTUNITY_STAGE_LABELS } from "@/lib/workflow/opportunity-stages";

interface Organization {
  id: number
  name: string
}

export function NewOpportunityForm({ organizations }: { organizations: Organization[] }) {
  const [name, setName] = useState('')
  const [stage, setStage] = useState(OPPORTUNITY_STAGES[0])
  const [estimatedValue, setEstimatedValue] = useState('')
  const [probability, setProbability] = useState('')
  const [organizationId, setOrganizationId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organizationId) {
      alert('Please select an organization')
      return
    }
    setLoading(true)

    try {
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          stage,
          estimated_value: parseFloat(estimatedValue),
          probability: parseInt(probability),
          organization_id: organizationId
        })
      })

      if (response.ok) {
        router.push('/opportunities')
      } else {
        console.error('Failed to create opportunity')
      }
    } catch (error) {
      console.error('Failed to create opportunity', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="name">Opportunity Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          data-testid="input-opportunity-name"
        />
      </div>
      <div>
        <Label htmlFor="organization">Organization</Label>
        <Select onValueChange={(value) => setOrganizationId(parseInt(value))}>
          <SelectTrigger data-testid="select-opportunity-organization_id">
            <SelectValue placeholder="Select an organization" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map(org => (
              <SelectItem key={org.id} value={org.id.toString()}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="stage">Stage</Label>
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger data-testid="select-opportunity-stage">
            <SelectValue placeholder="Select a stage" />
          </SelectTrigger>
          <SelectContent>
            {OPPORTUNITY_STAGES.map(s => (
              <SelectItem key={s} value={s}>{OPPORTUNITY_STAGE_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="estimatedValue">Estimated Value</Label>
        <Input
          id="estimatedValue"
          type="number"
          value={estimatedValue}
          onChange={(e) => setEstimatedValue(e.target.value)}
          data-testid="input-opportunity-estimated_value"
        />
      </div>
      <div>
        <Label htmlFor="probability">Probability (%)</Label>
        <Input
          id="probability"
          type="number"
          value={probability}
          onChange={(e) => setProbability(e.target.value)}
          data-testid="input-opportunity-probability"
        />
      </div>
      <Button type="submit" disabled={loading} data-testid="submit-opportunity">
        {loading ? 'Creating...' : 'Create Opportunity'}
      </Button>
    </form>
  )
}
