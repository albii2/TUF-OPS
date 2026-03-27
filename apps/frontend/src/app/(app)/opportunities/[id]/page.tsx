import Link from "next/link";
import { getOpportunity } from "@/lib/opportunities/queries";
import { getAssignableUsers } from "@/lib/users/queries";
import { PageHeader } from "@/components/ui/page-header";
import { PageActions } from "@/components/ui/page-actions";
import { Button } from "@/components/ui/button";
import { DetailPageShell } from "@/components/detail/detail-page-shell";
import { DetailSummaryCard } from "@/components/detail/detail-summary-card";
import { DetailSection } from "@/components/detail/detail-section";
import { DetailFieldList } from "@/components/detail/detail-field-list";
import { DetailField } from "@/components/detail/detail-field";
import { OpportunityHealthBadge } from "@/components/opportunities/opportunity-health-badge";
import { OpportunityWorkflowForm } from "@/components/opportunities/opportunity-workflow-form";
import { OpportunityOwnerCard } from "@/components/opportunities/opportunity-owner-card";
import { OwnerBadge } from "@/components/shared/owner-badge";
import { RecordNotFoundState } from "@/components/state/record-not-found-state";
import { StageBadge } from "@/components/opportunities/StageBadge";

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
    const opportunity = await getOpportunity(params.id);
    
    if (!opportunity || !opportunity.organization) {
        return <RecordNotFoundState recordLabel="Opportunity" backHref="/opportunities" />;
    }

    const { organization } = opportunity;
    const users = await getAssignableUsers();

    const estimatedValue = opportunity.estimated_value ? Number(opportunity.estimated_value) : 0;

    const formattedValue = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(estimatedValue);

    const workflowOpp = {
        stage: opportunity.stage,
        nextStep: opportunity.nextStep,
        nextStepDueDate: opportunity.nextStepDueDate,
        updatedAt: opportunity.updated_at,
    };

    return (
        <>
          <PageHeader
            title={opportunity.name}
            description={`Review and update the current state of this deal with ${organization.name}`}
            actions={
                <PageActions>
                    <Link href={`/opportunities/${opportunity.id}/edit`}>
                        <Button>Edit Opportunity</Button>
                    </Link>
                </PageActions>
            }
          />
   
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="col-span-1 lg:col-span-2">
                <DetailPageShell>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                        <DetailSummaryCard label="Stage" value={<StageBadge stage={opportunity.stage} />} />
                        <DetailSummaryCard label="Health" value={<OpportunityHealthBadge {...workflowOpp} />} />
                        <DetailSummaryCard label="Value" value={formattedValue} />
                        <DetailSummaryCard label="Owner" value={<OwnerBadge ownerName={opportunity.owner?.name} />} />
                    </div>

                    <DetailSection title="Commercial Details">
                        <DetailFieldList>
                            <DetailField label="Value">{formattedValue}</DetailField>
                            <DetailField label="Probability">{opportunity.probability ? `${opportunity.probability}%` : "-"}</DetailField>
                        </DetailFieldList>
                    </DetailSection>

                    <DetailSection title="Organization">
                        <Link href={`/organizations/${organization.id}`} className="font-semibold text-blue-600 hover:underline">
                            {organization.name}
                        </Link>
                    </DetailSection>
                </DetailPageShell>
            </div>
            <div className="col-span-1 space-y-6">
                <OpportunityWorkflowForm opportunity={opportunity} />
                <OpportunityOwnerCard opportunity={opportunity} users={users} />
            </div>
          </div>
        </>
      );
}
