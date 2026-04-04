'use client'

import { useFormState } from "react-dom";
import { createLead } from "@/app/(app)/leads/_actions/createLead";
import { FormShell } from "@/components/form/form-shell";
import { FormSection } from "@/components/form/form-section";
import { FormField } from "@/components/form/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormActions } from "@/components/form/form-actions";

const initialState = { message: "", errors: {} };

export function NewLeadForm() {
  const [state, dispatch] = useFormState(createLead, initialState);

  return (
    <form action={dispatch}>
      <FormShell>
        <FormSection title="Lead Details">
          <FormField label="Organization Name" error={state.errors?.organizationName?.[0]}>
            <Input name="organizationName" required />
          </FormField>
          <FormField label="Contact Name">
            <Input name="contactName" />
          </FormField>
          <FormField label="Contact Info (Email/Phone)">
            <Input name="contactInfo" />
          </FormField>
          <FormField label="Sport">
            <Input name="sport" />
          </FormField>
          <FormField label="Source">
            <Input name="source" />
          </FormField>
          <FormField label="Notes">
            <Textarea name="notes" />
          </FormField>
        </FormSection>
        <FormActions submitLabel="Create Lead" />
      </FormShell>
    </form>
  );
}
