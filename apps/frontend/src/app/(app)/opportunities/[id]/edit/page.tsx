import { getOpportunity } from "@/lib/opportunities/queries";
import { getAssignableUsers } from "@/lib/users/queries";
import { PageHeader } from "@/components/ui/page-header";
import { RecordNotFoundState } from "@/components/state/record-not-found-state";
import { OpportunityEditForm } from "@/components/opportunities/OpportunityEditForm";

export default async function EditOpportunityPage({ params }: { params: { id: string } }) {
    const opportunity = await getOpportunity(params.id);
    const users = await getAssignableUsers();

    if (!opportunity) {
        return (
            <RecordNotFoundState
                recordLabel="Opportunity"
                backHref="/opportunities"
            />
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Edit ${opportunity.name}`}
                description="Update the deal record and maintain a clean pipeline."
            />

            <OpportunityEditForm
                opportunity={opportunity}
                assignableUsers={users}
            />
        </div>
    );
}
