'use client'

import { useRouter } from 'next/navigation'
import { useFormStatus } from "react-dom";
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OPPORTUNITY_STAGES, OPPORTUNITY_STAGE_LABELS } from "@/lib/workflow/opportunity-stages";
import { createOpportunity } from "@/app/(app)/opportunities/new/actions";

interface Organization {
  id: number
  name: string
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} data-testid="submit-opportunity">
            {pending ? 'Creating...' : 'Create Opportunity'}
        </Button>
    )
}

export function NewOpportunityForm({ organizations }: { organizations: Organization[] }) {
  return (
    <form action={createOpportunity} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="name">Opportunity Name</Label>
        <Input id="name" name="name" required data-testid="input-opportunity-name" />
      </div>
      <div>
        <Label htmlFor="organizationId">Organization</Label>
        <Select name="organizationId" required>
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
        <Select name="stage" defaultValue={OPPORTUNITY_STAGES[0]}>
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
        <Input id="estimatedValue" name="estimatedValue" type="number" data-testid="input-opportunity-estimated_value" />
      </div>
      <div>
        <Label htmlFor="probability">Probability (%)</Label>
        <Input id="probability" name="probability" type="number" data-testid="input-opportunity-probability" />
      </div>
      <SubmitButton />
    </form>
  )
}
