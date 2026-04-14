import { Badge } from "@/components/ui/badge";
import { getOpportunityStageLabel } from "@/lib/workflow/opportunity-workflow";

export function OpportunityStageBadge({ stage }: { stage?: string | null }) {
  return <Badge>{getOpportunityStageLabel(stage)}</Badge>;
}
