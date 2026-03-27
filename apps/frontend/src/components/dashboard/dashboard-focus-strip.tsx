import { StatCard } from "@/components/ui/stat-card";

export function DashboardFocusStrip({ metrics }: { metrics: any }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
      <StatCard label="Stale Deals" value={metrics.staleCount} />
      <StatCard label="Missing Next Step" value={metrics.pendingActions.missing} />
      <StatCard label="Overdue Next Step" value={metrics.pendingActions.overdue} />
      <StatCard label="Total Pipeline" value={metrics.oppCounts.total} />
    </div>
  );
}
