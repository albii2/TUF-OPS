import { Badge } from "@/components/ui/badge";
import { ProgramStatus } from "@prisma/client";

export function ProgramStatusBadge({ 
  status,
}: {
  status?: ProgramStatus | null;
}) {
  if (status === "inactive") {
    return <Badge variant="secondary">Inactive</Badge>;
  }

  if (status === "archived") {
    return <Badge variant="outline">Archived</Badge>;
  }

  return <Badge>Active</Badge>;
}
