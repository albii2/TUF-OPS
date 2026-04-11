
import { PageHeader } from "@/components/ui/page-header";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import { DashboardFocusStrip } from "@/components/dashboard/dashboard-focus-strip";
import { DashboardRevenuePanel } from "@/components/dashboard/dashboard-revenue-panel";
import { DashboardNextActions } from "@/components/dashboard/dashboard-next-actions";

export default async function DashboardPage() {
    const data = await getDashboardData();

    return (
        <div className="space-y-6">
            <PageHeader
                title="Dashboard"
                description={`Here's the state of the business for today, ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`}
            />

            <DashboardFocusStrip data={data.focusMetrics} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="col-span-1 lg:col-span-2">
                    <DashboardRevenuePanel summary={data.revenueSummary} />
                </div>
                <div className="col-span-1">
                    <DashboardNextActions actions={data.nextActions} />
                </div>
            </div>
        </div>
    );
}
