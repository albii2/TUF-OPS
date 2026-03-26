"use client";

import { useState, useTransition } from "react";
import { Opportunity } from "@prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateOpportunityWorkflow } from "@/lib/opportunities/mutations";
import { UpdateOpportunityWorkflowSchema, UpdateOpportunityWorkflowData } from "@/lib/opportunities/validation";
import { DetailSection } from "@/components/detail/detail-section";
import { OpportunityStageSelect } from "./opportunity-stage-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OpportunityStage } from "@/lib/workflow/opportunity-stages";

interface OpportunityWorkflowFormProps {
  opportunity: Opportunity;
}

export function OpportunityWorkflowForm({ opportunity }: OpportunityWorkflowFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateOpportunityWorkflowData>({
    resolver: zodResolver(UpdateOpportunityWorkflowSchema),
    defaultValues: {
      id: opportunity.id,
      stage: opportunity.stage as OpportunityStage || undefined,
      nextStep: opportunity.nextStep || "",
      nextStepDueDate: opportunity.nextStepDueDate ? new Date(opportunity.nextStepDueDate) : null,
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    startTransition(async () => {
      await updateOpportunityWorkflow(data);
    });
  });

  return (
    <form onSubmit={onSubmit}>
      <DetailSection title="Workflow Control">
        <div className="space-y-4">
            <OpportunityStageSelect 
                defaultValue={form.getValues("stage")} 
                onValueChange={(value) => form.setValue("stage", value as OpportunityStage)}
            />
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
