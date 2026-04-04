'use client';

import { useTransition } from 'react';
import { Opportunity, OpportunityStage } from '@prisma/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { updateOpportunity } from '@/app/(app)/opportunities/_actions/updateOpportunity';
import { updateOpportunitySchema } from '@/lib/validation/opportunity';
import type { z } from 'zod';

import { DetailSection } from '@/components/detail/detail-section';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Create a plain object type that is safe to pass to the client
export type OpportunityForWorkflow = Omit<Opportunity, 'estimated_value' | 'close_date'> & {
    estimated_value: number;
    close_date: string | null;
  };

const workflowFormSchema = updateOpportunitySchema.pick({
  stage: true,
  nextStep: true,
  nextStepDueDate: true,
});

type WorkflowFormData = z.infer<typeof workflowFormSchema>;

const STAGE_OPTIONS: OpportunityStage[] = [
    'lead',
    'contacted',
    'mockup',
    'sample',
    'invoice',
    'closed_won',
    'closed_lost'
  ];

export function OpportunityWorkflowForm({ opportunity }: { opportunity: OpportunityForWorkflow }) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<WorkflowFormData>({
    resolver: zodResolver(workflowFormSchema),
    defaultValues: {
      stage: opportunity.stage,
      nextStep: opportunity.nextStep ?? '',
      nextStepDueDate: opportunity.nextStepDueDate ?? undefined,
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    startTransition(async () => {
        try {
            await updateOpportunity({ id: opportunity.id, ...data });
            toast.success("Workflow updated.");
        } catch (error) {
            toast.error("Failed to update workflow.");
        }
    });
  });

  return (
    <form onSubmit={onSubmit}>
      <DetailSection title="Workflow Control">
        <div className="space-y-4">
            <select {...form.register('stage')} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                {STAGE_OPTIONS.map(stage => (
                    <option key={stage} value={stage}>{
                        stage.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
                    }</option>
                ))}
            </select>
            <Input 
                placeholder="Next Step..." 
                {...form.register("nextStep")} 
            />
            <Input 
                type="date" 
                defaultValue={opportunity.nextStepDueDate ? new Date(opportunity.nextStepDueDate).toISOString().split('T')[0] : ""}

                {...form.register("nextStepDueDate", { valueAsDate: true })}
            />
            <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Update Workflow"}
            </Button>
        </div>
      </DetailSection>
    </form>
  );
}
