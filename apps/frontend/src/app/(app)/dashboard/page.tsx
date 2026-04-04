import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import { PageHeader } from "@/components/ui/page-header";
import { DashboardFocusStrip } from "@/components/dashboard/dashboard-focus-strip";
import { DashboardPipelineSnapshot } from "@/components/dashboard/dashboard-pipeline-snapshot";
import { DashboardOwnerLeaderboard } from "@/components/dashboard/dashboard-owner-leaderboard";
import { DashboardNearClose } from "@/components/dashboard/dashboard-near-close";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }

  const data = await getDashboardData(session);

  return (
    <div className="space-y-8">
      <PageHeader
        title="HQ Overview"
        description="What you should do right now to move deals and generate revenue."
      />
      
      <DashboardFocusStrip metrics={[
        { label: "Needs Action", value: data.metrics.needsAction },
        { label: "Needs Next Step", value: data.metrics.needsNextStep },
        { label: "Needs Update", value: data.metrics.needsUpdate },
      ]} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardPipelineSnapshot snapshot={data.snapshot} />
        </div>
        <div className="lg:col-span-1">
          <DashboardOwnerLeaderboard owners={data.owners} />
        </div>
        <div className="lg:col-span-3">
          <DashboardNearClose deals={data.deals.map(d => ({...d, id: d.id.toString(), value: d.estimated_value.toNumber(), closingDate: d.close_date!, opportunityName: d.name, programName: d.program?.name ?? ''}))} />
        </div>
      </div>
    </div>
  );
}
