import { Badge } from "@/components/ui/badge";
import { getOpportunityHealthState } from "@/lib/workflow/opportunity-workflow";

type Props = {
  stage?: string | null;
  nextStep?: string | null;
  nextStepDueDate?: string | Date | null;
  updatedAt?: string | Date | null;
};

export function OpportunityHealthBadge(props: Props) {
  const health = getOpportunityHealthState(props);

  if (health === "urgent") {
    return <Badge variant="destructive">Needs Action</Badge>;
  }

  if (health === "warning") {
    return <Badge variant="secondary">Attention Needed</Badge>;
  }

  if (health === "inactive") {
    return <Badge variant="outline">Inactive</Badge>;
  }

  return <Badge variant="outline">Healthy</Badge>;
}
