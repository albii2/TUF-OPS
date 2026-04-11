'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Opportunity, OpportunityStage } from '@prisma/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { updateOpportunityWorkflow } from '@/lib/opportunities/mutations';
import { updateOpportunitySchema } from '@/lib/validation/opportunity'; // Corrected import path
import type { z } from 'zod';
import { getAllowedOpportunityStageTransitions } from '@/lib/workflow/transitions';

import { DetailSection } from '@/components/detail/detail-section';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Create a partial schema for the workflow form
const workflowFormSchema = updateOpportunitySchema.pick({
  stage: true,
  nextStep: true,      // Assuming nextStep will be added to the main schema
  nextStepDueDate: true, // Assuming nextStepDueDate will be added to the main schema
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

export function OpportunityWorkflowForm({ opportunity }: { opportunity: Opportunity }) {
  const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const allowedTransitions = getAllowedOpportunityStageTransitions(opportunity.stage);

  const form = useForm<WorkflowFormData>({
    // resolver: zodResolver(workflowFormSchema), // Resolver might be too strict for partial updates
    defaultValues: {
      stage: opportunity.stage,
      nextStep: opportunity.nextStep ?? '',
      nextStepDueDate: opportunity.nextStepDueDate ?? null,
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    startTransition(async () => {
        try {
            await updateOpportunityWorkflow({
                id: String(opportunity.id),
                ...data,
            });
            toast.success("Workflow updated.");
            router.refresh();
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
                <option value={opportunity.stage}>{opportunity.stage.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}</option>
                {allowedTransitions.map(stage => (
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
                defaultValue={form.getValues("nextStepDueDate") ? new Date(form.getValues("nextStepDueDate")!).toISOString().split('T')[0] : ""}
                onChange={(e) => form.setValue("nextStepDueDate", e.target.value ? new Date(e.target.value) : null)}
            />
            <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Update Workflow"}
            </Button>
        </div>
      </DetailSection>
    </form>
  );
}
