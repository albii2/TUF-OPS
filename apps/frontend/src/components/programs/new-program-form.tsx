'use client'

import { useFormState, useFormStatus } from 'react-dom';
import { createProgram } from '@/app/(app)/organizations/new/actions';
import { FormShell } from '@/components/form/form-shell';
import { FormSection } from '@/components/form/form-section';
import { FormField } from '@/components/form/form-field';
import { FormActions } from '@/components/form/form-actions';
import { Input } from '@/components/ui/input';

const initialState = { message: "", errors: {} };

function SubmitButton() {
    const { pending } = useFormStatus();
    return <FormActions isPending={pending} submitLabel="Create Program" />;
}

export function NewProgramForm() {
  const [state, dispatch] = useFormState(createProgram, initialState);

  return (
    <form action={dispatch}>
        <FormShell>
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Create New Program</h1>
                <p className="text-muted-foreground">Programs are the schools, teams, or other entities you sell to.</p>
            </div>
            <FormSection>
                <FormField label="Program Name" error={state.errors?.name?.[0]}>
                    <Input name="name" required />
                </FormField>
            </FormSection>
            <SubmitButton />
        </FormShell>
    </form>
  );
}
