'use client'

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

import type { Opportunity, User, OpportunityStage } from '@prisma/client';
import { updateOpportunitySchema } from '@/lib/validation/opportunity';
import type { z } from 'zod';

import { updateOpportunity } from '@/app/(app)/opportunities/_actions/updateOpportunity';
import { FormShell } from '@/components/form/form-shell';
import { FormSection } from '@/components/form/form-section';
import { FormField } from '@/components/form/form-field';
import { Input } from '@/components/ui/input';
import { UserSelect } from '@/components/users/user-select';
import { Button } from "@/components/ui/button";

const STAGE_OPTIONS: OpportunityStage[] = [
  'lead',
  'contacted',
  'mockup',
  'sample',
  'invoice',
  'closed_won',
  'closed_lost'
];

// Create a plain Opportunity type that is safe for client components
export type PlainOpportunity = Omit<Opportunity, 'estimated_value'> & {
    estimated_value: number | null;
}

type FormData = z.infer<typeof updateOpportunitySchema>;

export function OpportunityEditForm({ 
    opportunity, 
    assignableUsers 
}: { 
    opportunity: PlainOpportunity, 
    assignableUsers: User[] 
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const isRep = session?.user?.role === "rep";

  const { 
    register, 
    handleSubmit, 
    control, 
    formState: { errors } 
  } = useForm<FormData>({
    resolver: zodResolver(updateOpportunitySchema),
    defaultValues: {
      id: opportunity.id,
      name: opportunity.name,
      stage: opportunity.stage,
      ownerId: opportunity.ownerId,
      estimatedValue: opportunity.estimated_value ?? 0,
      closeDate: opportunity.close_date,
      // These fields are required by the schema but not part of this specific form
      // We provide them here to satisfy the validation
      nextStep: opportunity.nextStep ?? "Update details",
      nextStepDueDate: opportunity.nextStepDueDate ?? new Date(),
    },
  });

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      try {
        // Ensure the ID is passed to the update action
        await updateOpportunity({ ...data, id: opportunity.id });
        toast.success("Opportunity updated successfully.");
        router.push(`/opportunities/${opportunity.id}`);
      } catch (error) {
        console.error("Update failed:", error);
        toast.error("An error occurred. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormShell>
        <FormSection
          title="General Information"
        >
          <p className="text-sm text-muted-foreground">Update the core details of this opportunity.</p>
          <FormField label="Opportunity Name" error={errors.name?.message}>
            <Input {...register('name')} />
          </FormField>
        </FormSection>

        <FormSection
          title="Deal Information"
        >
          <p className="text-sm text-muted-foreground">Manage the stage, value, and timeline of this deal.</p>
          <FormField label="Stage">
            <Controller
              name="stage"
              control={control}
              render={({ field }) => (
                  <select {...field} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                      {STAGE_OPTIONS.map(stage => (
                          <option key={stage} value={stage}>{
                              stage.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
                          }</option>
                      ))}
                  </select>
              )}
            />
          </FormField>
          <FormField label="Estimated Value" error={errors.estimatedValue?.message}>
              <Input type="number" {...register('estimatedValue', { valueAsNumber: true })} />
          </FormField>
          <FormField label="Close Date">
            <Controller
              name="closeDate"
              control={control}
              render={({ field }) => (
                  <Input 
                      type="date" 
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                  />
              )}
            />
          </FormField>
        </FormSection>

        {!isRep && (
          <FormSection
            title="Ownership"
          >
            <p className="text-sm text-muted-foreground">Assign an owner to this opportunity.</p>
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
        )}

        <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
            </Button>
        </div>
      </FormShell>
    </form>
  );
}
