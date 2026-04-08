'use client'

import { useFormState, useFormStatus } from 'react-dom';
import { createOrganization } from '@/app/(app)/organizations/new/actions';
import { FormShell } from '@/components/form/form-shell';
import { FormSection } from '@/components/form/form-section';
import { FormField } from '@/components/form/form-field';
import { FormActions } from '@/components/form/form-actions';
import { Input } from '@/components/ui/input';

const initialState = { message: '', errors: {} };

function SubmitButton() {
    const { pending } = useFormStatus();
    return <FormActions isSubmitting={pending} submitLabel="Create Organization" />;
}

export function NewOrganizationForm() {
  const [state, dispatch] = useFormState(createOrganization, initialState);

  return (
    <form action={dispatch}>
        <FormShell 
            title="Create New Organization" 
            description="Organizations are the schools, teams, or other entities you sell to."
        >
            <FormSection>
                <FormField label="Organization Name" error={state.errors?.name?.[0]}>
                    <Input name="name" required />
                </FormField>
            </FormSection>
            <SubmitButton />
        </FormShell>
    </form>
  );
}
