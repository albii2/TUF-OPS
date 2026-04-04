'use client'

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';

import { quickUpdateOpportunity } from '@/app/(app)/opportunities/my/actions';
import { quickUpdateOpportunitySchema } from '@/lib/validation/opportunity';
import { Opportunity } from '@prisma/client';
import { OPPORTUNITY_STAGES, OPPORTUNITY_STAGE_LABELS } from '@/lib/workflow/opportunity-stages';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/components/form/form-field';

type QuickUpdateFormData = z.infer<typeof quickUpdateOpportunitySchema>;

export function QuickUpdateOpportunityForm({ opportunity, onSuccess }: { opportunity: Opportunity, onSuccess: () => void }) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<QuickUpdateFormData>({
    resolver: zodResolver(quickUpdateOpportunitySchema),
    defaultValues: {
      id: String(opportunity.id),
      stage: opportunity.stage as any, // TODO: Fix type
      nextStep: opportunity.nextStep ?? '',
      nextStepDueDate: opportunity.nextStepDueDate ?? undefined,
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    startTransition(async () => {
        try {
            await quickUpdateOpportunity(data);
            toast.success("Opportunity updated.");
            onSuccess();
        } catch (error) {
            toast.error("Failed to update opportunity.");
        }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
        <FormField label="Stage">
            <Select onValueChange={(value) => form.setValue('stage', value as any)} defaultValue={form.getValues('stage')}>
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
      
        <FormField label="Next Step" error={form.formState.errors.nextStep?.message}>
            <Input {...form.register("nextStep")} />
        </FormField>

        <FormField label="Next Step Due Date" error={form.formState.errors.nextStepDueDate?.message}>
            <Input 
                type="date" 
                defaultValue={form.getValues("nextStepDueDate") ? new Date(form.getValues("nextStepDueDate")!).toISOString().split('T')[0] : ""}
                {...form.register("nextStepDueDate")}
            />
        </FormField>

        <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
            </Button>
        </div>
    </form>
  );
}
