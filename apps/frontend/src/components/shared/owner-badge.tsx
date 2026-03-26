import { Badge } from "@/components/ui/badge";

export function OwnerBadge({ ownerName }: { ownerName?: string | null }) {
  if (!ownerName) {
    return <Badge variant="outline">Unassigned</Badge>;
  }

  return <Badge variant="secondary">{ownerName}</Badge>;
}
