'use client'

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import type { Opportunity, User, OpportunityStage } from '@prisma/client';
import { updateOpportunitySchema } from '@/lib/validation/opportunity';
import type { z } from 'zod';

import { updateOpportunity } from '@/app/(app)/opportunities/_actions/updateOpportunity';
import { FormShell } from '@/components/form/form-shell';
import { FormSection } from '@/components/form/form-section';
import { FormField } from '@/components/form/form-field';
import { FormActions } from '@/components/form/form-actions';
import { Input } from '@/components/ui/input';
import { UserSelect } from '@/components/users/user-select';

const STAGE_OPTIONS: OpportunityStage[] = [
  'lead',
  'contacted',
  'mockup',
  'sample',
  'invoice',
  'closed_won',
  'closed_lost'
];

type FormData = z.infer<typeof updateOpportunitySchema>;

export function OpportunityEditForm({ 
    opportunity, 
    assignableUsers 
}: { 
    opportunity: Opportunity, 
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
    resolver: zodResolver(updateOpportunitySchema),
    defaultValues: {
      id: String(opportunity.id),
      name: opportunity.name,
      stage: opportunity.stage,
      ownerId: String(opportunity.ownerId ?? ''),
      estimatedValue: opportunity.estimated_value ? Number(opportunity.estimated_value) : 0,
      closeDate: opportunity.close_date,
    },
  });

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      try {
        await updateOpportunity(data);
        toast.success("Opportunity updated successfully.");
        router.push(`/opportunities/${opportunity.id}`);
      } catch (error) {
        toast.error("An error occurred. Please try again.");
      }
    });
  };

  return (
    <FormShell onSubmit={handleSubmit(onSubmit)}>
      <FormSection
        title="General Information"
        description="Update the core details of this opportunity."
      >
        <FormField label="Opportunity Name" error={errors.name?.message}>
          <Input {...register('name')} />
        </FormField>
      </FormSection>

      <FormSection
        title="Deal Information"
        description="Manage the stage, value, and timeline of this deal."
      >
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

      <FormSection
        title="Ownership"
        description="Assign an owner to this opportunity."
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
