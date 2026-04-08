"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import type { Organization } from "@prisma/client";
import { updateOrganizationSchema } from "@/lib/organizations/validation";
import type { z } from "zod";

import { updateOrganizationAction } from "@/app/(app)/organizations/[id]/actions";
import { FormShell } from "@/components/form/form-shell";
import { FormSection } from "@/components/form/form-section";
import { FormField } from "@/components/form/form-field";
import { FormActions } from "@/components/form/form-actions";
import { Input } from "@/components/ui/input";
import { OrganizationStatusSelect } from "@/components/organizations/organization-status-select";
import { UserSelect } from "@/components/users/user-select";

type FormData = z.infer<typeof updateOrganizationSchema>;

export function EditOrganizationForm({ 
    organization, 
    assignableUsers 
}: { 
    organization: Organization, 
    assignableUsers: { id: number; name: string | null; email: string; role: string }[] 
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { 
    register, 
    handleSubmit, 
    control, 
    formState: { errors } 
  } = useForm<FormData>({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: {
      id: String(organization.id),
      name: organization.name,
      status: organization.status,
      ownerId: String(organization.ownerId ?? ""),
      zohoAccountId: organization.zoho_account_id ?? "",
    },
  });

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      try {
        await updateOrganizationAction({
          id: organization.id,
          name: data.name,
          status: data.status,
          ownerId: data.ownerId ? parseInt(data.ownerId, 10) : null,
          zohoAccountId: data.zohoAccountId,
        });
        toast.success("Organization updated successfully.");
        router.push(`/organizations/${organization.id}`);
      } catch (error) {
        toast.error("An error occurred. Please try again.");
      }
    });
  };

  return (
    <FormShell onSubmit={handleSubmit(onSubmit)}>
      <FormSection
        title="Organization Details"
        description="Update the core details for this account record."
      >
        <FormField label="Organization Name" error={errors.name?.message}>
          <Input {...register("name")} />
        </FormField>

        <FormField label="Status">
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <OrganizationStatusSelect
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </FormField>

        <FormField label="Zoho Account ID" error={errors.zohoAccountId?.message}>
          <Input {...register("zohoAccountId")} />
        </FormField>
      </FormSection>

      <FormSection
        title="Ownership"
        description="Assign an owner to this account."
      >
        <FormField label="Owner">
            <Controller
                name="ownerId"
                control={control}
                render={({ field }) => (
                    <UserSelect 
                        users={assignableUsers} 
                        value={field.value ?? undefined}
                        onChange={field.onChange} 
                    />
                )}
            />
        </FormField>
      </FormSection>

      <FormActions isPending={isPending} />
    </FormShell>
  );
}
