import { PipelineStageSummary } from "@/types/dashboard";
import { DashboardSectionCard } from "./dashboard-section-card";
import { Progress } from "@/components/ui/progress";

export function DashboardPipelineSnapshot({ snapshot }: { snapshot: PipelineStageSummary[] }) {
  const totalValue = snapshot.reduce((sum, stage) => sum + stage.totalValue, 0);

  return (
    <DashboardSectionCard title="Pipeline Snapshot">
      {snapshot.length > 0 ? (
        <div className="space-y-4">
          {snapshot.map((stage) => (
            <div key={stage.stage} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{stage.stage}</span>
                <span className="text-muted-foreground">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(stage.totalValue)}</span>
              </div>
              <Progress value={(stage.totalValue / totalValue) * 100} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No pipeline data available.</p>
      )}
    </DashboardSectionCard>
  );
}
