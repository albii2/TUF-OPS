'use client'

import { useFormState, useFormStatus } from 'react-dom';
import { createOpportunity } from '@/app/(app)/opportunities/new/actions';
import { FormShell } from '@/components/form/form-shell';
import { FormSection } from '@/components/form/form-section';
import { FormField } from '@/components/form/form-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OPPORTUNITY_STAGES, OPPORTUNITY_STAGE_LABELS } from "@/lib/workflow/opportunity-stages";
import { Button } from "@/components/ui/button";

interface Program {
  id: number
  name: string
}

const initialState = { message: "", errors: {} };

function SubmitButton() {
    const { pending } = useFormStatus();
    return <Button type="submit" disabled={pending}>Create Opportunity</Button>;
}

export function NewOpportunityForm({ programs }: { programs: Program[] }) {
  const [state, dispatch] = useFormState(createOpportunity, initialState);

  return (
    <form action={dispatch}>
        <FormShell>
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Create New Opportunity</h1>
                <p className="text-muted-foreground">Create a new opportunity and connect it to an program.</p>
            </div>
            <FormSection>
                <FormField label="Opportunity Name" error={state.errors?.name?.[0]}>
                    <Input name="name" required />
                </FormField>

                <FormField label="Program" error={state.errors?.program_id?.[0]}>
                    <Select name="programId" required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an program" />
                        </SelectTrigger>
                        <SelectContent>
                            {programs.map(prog => (
                            <SelectItem key={prog.id} value={prog.id.toString()}>
                                {prog.name}
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

            <FormSection title="Next Step">
                <FormField label="Next Step" error={state.errors?.nextStep?.[0]}>
                    <Input name="nextStep" required />
                </FormField>
                <FormField label="Next Step Due Date" error={state.errors?.nextStepDueDate?.[0]}>
                    <Input name="nextStepDueDate" type="date" required />
                </FormField>
            </FormSection>

            <SubmitButton />
        </FormShell>
    </form>
  );
}
