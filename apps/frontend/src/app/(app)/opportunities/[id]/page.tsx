import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { DetailPageShell } from "@/components/detail/detail-page-shell";
import { DetailSummaryCard } from "@/components/detail/detail-summary-card";
import { DetailSection } from "@/components/detail/detail-section";
import { DetailFieldList } from "@/components/detail/detail-field-list";
import { DetailField } from "@/components/detail/detail-field";
import { OpportunityStageBadge } from "@/components/opportunities/opportunity-stage-badge";
import { OpportunityHealthBadge } from "@/components/opportunities/opportunity-health-badge";
import { OpportunityNextStepCard } from "@/components/opportunities/opportunity-next-step-card";

async function getOpportunity(id: string) {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: parseInt(id, 10) },
      include: { organization: true },
    });
  
    if (!opportunity || !opportunity.organization) {
      notFound();
    }
    return opportunity;
}

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
    const opportunity = await getOpportunity(params.id);
    const { organization } = opportunity;

    const estimatedValue = opportunity.estimated_value ? Number(opportunity.estimated_value) : 0;

    const formattedValue = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(estimatedValue);

    const createdLabel = opportunity.created_at?.toLocaleDateString() || "-";
    const updatedLabel = opportunity.updated_at?.toLocaleDateString() || "-";

    // Create a workflow-compatible object for our helpers
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
            description={`Review the current state of this deal with ${organization.name}`}
          />
   
          <DetailPageShell>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <DetailSummaryCard label="Stage" value={<OpportunityStageBadge stage={opportunity.stage} />} />
                <DetailSummaryCard label="Health" value={<OpportunityHealthBadge {...workflowOpp} />} />
                <DetailSummaryCard label="Value" value={formattedValue} />
                <DetailSummaryCard label="Next Step Due" value={opportunity.nextStepDueDate?.toLocaleDateString() || "-"} />
            </div>

            <OpportunityNextStepCard
              nextStep={opportunity.nextStep}
              nextStepDueDate={opportunity.nextStepDueDate}
              ownerName={null} // Placeholder for now
            />

            <DetailSection title="Deal Status">
              <DetailFieldList>
                <DetailField label="Stage"><OpportunityStageBadge stage={opportunity.stage} /></DetailField>
                <DetailField label="Health"><OpportunityHealthBadge {...workflowOpp} /></DetailField>
                <DetailField label="Created">{createdLabel}</DetailField>
                <DetailField label="Last Updated">{updatedLabel}</DetailField>
              </DetailFieldList>
            </DetailSection>
   
            <DetailSection title="Organization Relationship">
              <DetailFieldList>
                <DetailField label="Organization">
                    <Link href={`/organizations/${organization.id}`} className="underline-offset-4 hover:underline">
                      {organization.name}
                    </Link>
                </DetailField>
              </DetailFieldList>
            </DetailSection>
   
            <DetailSection title="Commercial Details">
              <DetailFieldList>
                <DetailField label="Value">{formattedValue}</DetailField>
                <DetailField label="Probability">{opportunity.probability ? `${opportunity.probability}%` : "-"}</DetailField>
              </DetailFieldList>
            </DetailSection>

          </DetailPageShell>
        </>
      );
}
