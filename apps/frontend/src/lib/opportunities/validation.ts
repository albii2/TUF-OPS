import { z } from "zod";
import { OPPORTUNITY_STAGES } from "@/lib/workflow/opportunity-stages";

export const UpdateOpportunityWorkflowSchema = z.object({
  id: z.number(),
  stage: z.enum(OPPORTUNITY_STAGES).optional(),
  nextStep: z.string().max(255, "Next step must be 255 characters or less").optional(),
  nextStepDueDate: z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
  }, z.date()).optional().nullable(),
});

export type UpdateOpportunityWorkflowData = z.infer<typeof UpdateOpportunityWorkflowSchema>;
