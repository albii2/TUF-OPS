import { StatCard } from "@/components/ui/stat-card";
import { FocusMetrics } from "@/types/dashboard";

export function DashboardFocusStrip({ metrics }: { metrics: FocusMetrics }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <StatCard label="Needs Update" value={metrics.needsUpdate} />
      <StatCard label="Missing Next Step" value={metrics.needsNextStep} />
      <StatCard label="Overdue Next Step" value={metrics.needsAction} />
    </div>
  );
}
