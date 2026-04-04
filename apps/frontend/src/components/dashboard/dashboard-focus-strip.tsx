import { StatCard } from "@/components/ui/stat-card";
import { FocusMetric } from "@/types/dashboard";

export function DashboardFocusStrip({ metrics }: { metrics: FocusMetric[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {metrics.map((metric) => (
        <StatCard key={metric.label} label={metric.label} value={metric.value} />
      ))}
    </div>
  );
}
