"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import type { Program, User } from "@prisma/client";
import { updateProgramSchema } from "@/lib/programs/validation";
import type { z } from "zod";

import { updateProgramAction } from "@/app/(app)/programs/[id]/actions";
import { FormShell } from "@/components/form/form-shell";
import { FormSection } from "@/components/form/form-section";
import { FormField } from "@/components/form/form-field";
import { FormActions } from "@/components/form/form-actions";
import { Input } from "@/components/ui/input";
import { ProgramStatusSelect } from "@/components/programs/program-status-select";
import { UserSelect } from "@/components/users/user-select";

type FormData = z.infer<typeof updateProgramSchema>;

export function EditProgramForm({ 
    program, 
    assignableUsers 
}: { 
    program: Program, 
    assignableUsers: User[] 
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { 
    register, 
    handleSubmit, 
    control, 
    formState: { errors } 
  } = useForm<FormData>({
    resolver: zodResolver(updateProgramSchema),
    defaultValues: {
      id: String(program.id),
      name: program.name,
      status: program.status,
      ownerId: String(program.ownerId ?? ""),
      zohoAccountId: program.zoho_account_id ?? "",
    },
  });

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      try {
        await updateProgramAction({
          id: program.id,
          name: data.name,
          status: data.status,
          ownerId: data.ownerId ? parseInt(data.ownerId, 10) : null,
          zohoAccountId: data.zohoAccountId,
        });
        toast.success("Program updated successfully.");
        router.push(`/programs/${program.id}`);
      } catch (error) {
        toast.error("An error occurred. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormShell>
        <FormSection
          title="Program Details"
        >
          <p className="text-sm text-muted-foreground">Update the core details for this account record.</p>
          <FormField label="Program Name" error={errors.name?.message}>
            <Input {...register("name")} />
          </FormField>

          <FormField label="Status">
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <ProgramStatusSelect
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
        >
          <p className="text-sm text-muted-foreground">Assign an owner to this account.</p>
          <FormField label="Owner">
              <Controller
                  name="ownerId"
                  control={control}
                  render={({ field }) => (
                      <UserSelect 
                          users={assignableUsers} 
                          value={field.value ? parseInt(field.value) : undefined}
                          onChange={field.onChange} 
                      />
                  )}
              />
          </FormField>
        </FormSection>

        <FormActions isPending={isPending} />
      </FormShell>
    </form>
  );
}
