import { Badge } from "@/components/ui/badge";
import { OrganizationStatus } from "@prisma/client";

export function OrganizationStatusBadge({ 
  status,
}: {
  status?: OrganizationStatus | null;
}) {
  if (status === "inactive") {
    return <Badge variant="secondary">Inactive</Badge>;
  }

  if (status === "archived") {
    return <Badge variant="outline">Archived</Badge>;
  }

  return <Badge>Active</Badge>;
}
