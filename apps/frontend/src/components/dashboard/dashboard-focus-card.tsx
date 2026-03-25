import { Card, CardContent } from "@/components/ui/card";
import { FocusMetric } from "@/types/dashboard";
import { ChevronRight } from "lucide-react";

export function DashboardFocusCard({ metric }: { metric: FocusMetric }) {
  return (
    <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{metric.value}</span>
          <span className="text-sm text-muted-foreground">{metric.label}</span>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
