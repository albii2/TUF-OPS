import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import { PageHeader } from "@/components/ui/page-header";
import { DashboardFocusStrip } from "@/components/dashboard/dashboard-focus-strip";
import { DashboardNextActions } from "@/components/dashboard/dashboard-next-actions";
import { DashboardPipelineSnapshot } from "@/components/dashboard/dashboard-pipeline-snapshot";
import { DashboardRevenuePanel } from "@/components/dashboard/dashboard-revenue-panel";
import { DashboardNearClose } from "@/components/dashboard/dashboard-near-close";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Today’s Focus"
        description="What you should do right now to move deals and generate revenue."
      />
      
      <DashboardFocusStrip metrics={data.focusMetrics} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="col-span-1 lg:col-span-1">
          <DashboardNextActions actions={data.nextActions} />
        </div>
        <div className="col-span-1 lg:col-span-1">
          <DashboardPipelineSnapshot snapshot={data.pipelineSnapshot} />
        </div>
        <div className="col-span-1 lg:col-span-1">
          <DashboardRevenuePanel summary={data.revenueSummary} />
        </div>
      </div>

      <div>
        <DashboardNearClose deals={data.dealsNearClose} />
      </div>
    </div>
  );
}
