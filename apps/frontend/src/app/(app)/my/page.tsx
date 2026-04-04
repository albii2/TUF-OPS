import { requireSession } from "@/lib/auth/session";
import { getMyDashboardMetrics } from "@/lib/metrics/queries";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";

export default async function MyWorkspacePage() {
    const session = await requireSession();

    const data = await getMyDashboardMetrics(session.user.id);

    return (
        <div className="space-y-8">
            <PageHeader
                title="My Workspace"
                description="Your personal view of the pipeline. Focus on what matters now."
            />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
                <StatCard label="My Active Deals" value={data.myOppCount} />
                <StatCard label="My Accounts" value={data.myProgramCount} />
                <StatCard label="Stale Deals" value={data.myStaleCount} />
                <StatCard label="Missing Next Step" value={data.myMissingNextStepCount} />
                <StatCard label="Overdue Next Step" value={data.myOverdueNextStepCount} />
            </div>
        </div>
    );
}
