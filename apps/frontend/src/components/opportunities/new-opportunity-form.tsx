'use client'

import { useFormState, useFormStatus } from 'react-dom';
import { createOpportunity } from '@/app/(app)/opportunities/new/actions';
import { FormShell } from '@/components/form/form-shell';
import { FormSection } from '@/components/form/form-section';
import { FormField } from '@/components/form/form-field';
import { FormActions } from '@/components/form/form-actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OPPORTUNITY_STAGES, OPPORTUNITY_STAGE_LABELS } from "@/lib/workflow/opportunity-stages";

interface Organization {
  id: number
  name: string
}

const initialState = { message: '', errors: {} };

function SubmitButton() {
    const { pending } = useFormStatus();
    return <FormActions isSubmitting={pending} submitLabel="Create Opportunity" />;
}

export function NewOpportunityForm({ organizations }: { organizations: Organization[] }) {
  const [state, dispatch] = useFormState(createOpportunity, initialState);

  return (
    <form action={dispatch}>
        <FormShell 
            title="Create New Opportunity" 
            description="Create a new opportunity and connect it to an organization."
        >
            <FormSection>
                <FormField label="Opportunity Name" error={state.errors?.name?.[0]}>
                    <Input name="name" required />
                </FormField>

                <FormField label="Organization" error={state.errors?.organization_id?.[0]}>
                    <Select name="organizationId" required>
                        <SelectTrigger>
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
                </FormField>
            </FormSection>

            <FormSection title="Deal Details">
                <FormField label="Stage">
                    <Select name="stage" defaultValue={OPPORTUNITY_STAGES[0]}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a stage" />
                        </SelectTrigger>
                        <SelectContent>
                            {OPPORTUNITY_STAGES.map(s => (
                                <SelectItem key={s} value={s}>{OPPORTUNITY_STAGE_LABELS[s]}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField label="Estimated Value">
                    <Input name="estimatedValue" type="number" />
                </FormField>

                <FormField label="Probability (%)">
                    <Input name="probability" type="number" />
                </FormField>
            </FormSection>

            <SubmitButton />
        </FormShell>
    </form>
  );
}
