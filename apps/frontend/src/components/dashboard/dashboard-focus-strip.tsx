import { DashboardFocusCard } from "./dashboard-focus-card";
import { FocusMetric } from "@/types/dashboard";

export function DashboardFocusStrip({ metrics }: { metrics: FocusMetric[] }) {
  if (metrics.length === 0) {
    return null; // Or a placeholder
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {metrics.map((metric) => (
        <DashboardFocusCard key={metric.label} metric={metric} />
      ))}
    </div>
  );
}
