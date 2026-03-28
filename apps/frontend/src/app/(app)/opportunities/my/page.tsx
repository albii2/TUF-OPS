import { requireSession } from "@/lib/auth/session";
import { getMyOpportunities } from "@/lib/opportunities/queries";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { columns as repColumns, RepOpportunity } from "@/components/opportunities/rep-columns";
import OpportunityFocusSection from "@/components/opportunities/opportunity-focus-section";
import { hasNextStep, isNextStepOverdue, isOpportunityStale } from "@/lib/workflow/opportunity-workflow";

export default async function MyOpportunitiesPage() {
    const session = await requireSession();
    const opportunities = await getMyOpportunities(parseInt(session.user.id));

    const dealsWithoutNextStep = opportunities.filter(opp => !hasNextStep(opp));
    const overdueDeals = opportunities.filter(opp => isNextStepOverdue(opp));
    const staleDeals = opportunities.filter(opp => isOpportunityStale(opp));

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Opportunities"
                description="Your personal pipeline and daily focus."
            />

            <OpportunityFocusSection 
                dealsWithoutNextStep={dealsWithoutNextStep}
                overdueDeals={overdueDeals}
                staleDeals={staleDeals}
            />

            <DataTable 
                columns={repColumns}
                data={opportunities as RepOpportunity[]} 
                searchKey="name"
            />
        </div>
    );
}
