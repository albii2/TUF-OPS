'use client'

import { useFormState, useFormStatus } from 'react-dom';
import { createOpportunity } from '@/app/(app)/opportunities/new/actions';
import { FormShell } from '@/components/form/form-shell';
import { FormSection } from '@/components/form/form-section';
import { FormField } from '@/components/form/form-field';
import { FormActions } from '@/components/form/form-actions';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OPPORTUNITY_STAGES, OPPORTUNITY_STAGE_LABELS } from "@/lib/workflow/stage-utils";
import { OpportunityStage } from '@prisma/client';
import { useState } from 'react';

interface Organization {
  id: number
  name: string
}

const initialState = { message: '', errors: {} };

const TERMINAL_STAGES: OpportunityStage[] = [OpportunityStage.closed_won, OpportunityStage.closed_lost];

function SubmitButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus();
    return <FormActions isSubmitting={pending} submitLabel="Create Opportunity" disabled={disabled} />;
}

export function NewOpportunityForm({ organizations, readOnly = false }: { organizations: Organization[]; readOnly?: boolean }) {
  const [state, dispatch] = useFormState(createOpportunity, initialState);
  const [currentStage, setCurrentStage] = useState<OpportunityStage>(OPPORTUNITY_STAGES[0]);

  const isNextStepRequired = !TERMINAL_STAGES.includes(currentStage);

  return (
    <form action={dispatch}>
        <FormShell 
            title="Create New Opportunity" 
            description="Create a new opportunity and connect it to an organization."
        >
            {readOnly ? (
                <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    Opportunity creation is temporarily unavailable until the database connection is configured.
                </p>
            ) : null}

            <FormSection>
                <FormField label="Opportunity Name" error={state.errors?.name?.[0]}>
                    <Input name="name" required />
                </FormField>

                <FormField label="Organization" error={state.errors?.organization_id?.[0]}>
                    <Select name="organizationId" required disabled={readOnly}>
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
                    <Select name="stage" defaultValue={currentStage} onValueChange={(v) => setCurrentStage(v as OpportunityStage)}>
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

            <FormSection title="Next Step">
                 <FormField label="Next Step" error={state.errors?.nextStep?.[0]}>
                    <Input name="nextStep" required={isNextStepRequired} />
                </FormField>
                <FormField label="Next Step Due Date" error={state.errors?.nextStepDueDate?.[0]}>
                    <Input name="nextStepDueDate" type="date" />
                </FormField>
            </FormSection>

            <SubmitButton disabled={readOnly} />
        </FormShell>
    </form>
  );
}
