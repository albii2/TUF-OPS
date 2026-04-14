import { getDashboardMetrics } from "@/lib/metrics/queries";
import { PageHeader } from "@/components/ui/page-header";
import { DashboardFocusStrip } from "@/components/dashboard/dashboard-focus-strip";
import { DashboardPipelineSnapshot } from "@/components/dashboard/dashboard-pipeline-snapshot";
import { DashboardOwnerLeaderboard } from "@/components/dashboard/dashboard-owner-leaderboard";

export default async function DashboardPage() {
  const data = await getDashboardMetrics();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Today’s Focus"
        description="What you should do right now to move deals and generate revenue."
      />
      
      <DashboardFocusStrip metrics={data} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="col-span-1 lg:col-span-1">
          <DashboardPipelineSnapshot snapshot={data.oppsByStage} />
        </div>
        <div className="col-span-1 lg:col-span-1">
            <DashboardOwnerLeaderboard owners={data.oppsByOwner} />
        </div>
      </div>
    </div>
  );
}
