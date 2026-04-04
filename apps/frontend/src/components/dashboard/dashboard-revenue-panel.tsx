import { RevenueSummary } from "@/types/dashboard";
import { DashboardSectionCard } from "./dashboard-section-card";
import { Progress } from "@/components/ui/progress";

export function DashboardRevenuePanel({ summary }: { summary: RevenueSummary }) {
  const formatCurrency = (value: number) => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

  return (
    <DashboardSectionCard title="Revenue">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{formatCurrency(summary.total)}</p>
        </div>
        <div className="space-y-2">
            <div>
                <div className="flex justify-between text-sm">
                    <span>Pending</span>
                    <span>{formatCurrency(summary.pending)}</span>
                </div>
                <Progress value={(summary.pending / summary.total) * 100} className="h-2"/>
            </div>
            <div>
                <div className="flex justify-between text-sm">
                    <span>Overdue</span>
                    <span>{formatCurrency(summary.overdue)}</span>
                </div>
                <Progress value={(summary.overdue / summary.total) * 100} className="h-2 bg-destructive"/>
            </div>
        </div>
      </div>
    </DashboardSectionCard>
  );
}
