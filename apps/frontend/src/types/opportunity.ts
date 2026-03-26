import type { OpportunityStage } from "@/lib/workflow/opportunity-stages";

export type OpportunityRecord = {
  id: string;
  name: string;
  stage?: OpportunityStage | null;
  estimatedValue?: number | null;
  nextStep?: string | null;
  nextStepDueDate?: string | Date | null;
  updatedAt?: string | Date | null;
  createdAt?: string | Date | null;
  organizationId?: string | null;
  organizationName?: string | null;
};
