import { Card, CardContent } from "@/components/ui/card";
import type { ReactNode } from "react";

interface DetailSummaryCardProps {
  label: string;
  value: ReactNode;
}

export function DetailSummaryCard({ label, value }: DetailSummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
