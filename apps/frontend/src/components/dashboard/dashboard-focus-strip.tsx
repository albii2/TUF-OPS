
import { StatCard } from "@/components/ui/stat-card";
import { FocusMetric } from "@/types/dashboard";

export function DashboardFocusStrip({ data }: { data: FocusMetric[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {data.map((metric) => (
        <StatCard key={metric.label} label={metric.label} value={metric.value} />
      ))}
    </div>
  );
}
