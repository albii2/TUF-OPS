import { requireSession } from "@/lib/auth/session";
import { getMyOpportunities } from "@/lib/opportunities/queries";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { columns as repColumns, RepOpportunity } from "@/components/opportunities/rep-columns";
import OpportunityFocusSection from "@/components/opportunities/opportunity-focus-section";
import { getOpportunityHealth } from "@/lib/workflow/opportunity-workflow";

const PressureHeader = ({ opportunities }: { opportunities: RepOpportunity[] }) => {
    const needsActionCount = opportunities.filter(opp => getOpportunityHealth(opp) !== 'healthy').length;
    const overdueCount = opportunities.filter(opp => getOpportunityHealth(opp) === 'overdue').length;
    const missingStepCount = opportunities.filter(opp => getOpportunityHealth(opp) === 'missing_step').length;

    return (
        <div className="flex items-center space-x-4 text-lg font-bold">
            <span>🔥 Deals needing action: {needsActionCount}</span>
            <span>⏰ Overdue deals: {overdueCount}</span>
            <span>⚠️ Missing next step: {missingStepCount}</span>
        </div>
    )
}

export default async function MyOpportunitiesPage() {
    const session = await requireSession();
    const opportunities = await getMyOpportunities(parseInt(session.user.id));

    const mustActToday = opportunities.filter(opp => getOpportunityHealth(opp) === 'overdue');
    const atRisk = opportunities.filter(opp => getOpportunityHealth(opp) === 'at_risk');
    const missingNextStep = opportunities.filter(opp => getOpportunityHealth(opp) === 'missing_step');

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Opportunities"
                description="Your personal pipeline and daily focus."
            />

            <PressureHeader opportunities={opportunities as RepOpportunity[]} />

            <OpportunityFocusSection 
                mustActToday={mustActToday}
                atRisk={atRisk}
                missingNextStep={missingNextStep}
            />

            <DataTable 
                columns={repColumns}
                data={opportunities as RepOpportunity[]} 
                searchKey="name"
                emptyStateMessage="Your pipeline is clear! New opportunities assigned to you will appear here."
            />
        </div>
    );
}
