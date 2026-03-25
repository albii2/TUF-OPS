import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

interface DetailBadgeRowProps {
    badges: ReactNode[];
}

export function DetailBadgeRow({ badges }: DetailBadgeRowProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge, index) => (
        <Badge key={index} variant="secondary">{badge}</Badge>
      ))}
    </div>
  );
}
