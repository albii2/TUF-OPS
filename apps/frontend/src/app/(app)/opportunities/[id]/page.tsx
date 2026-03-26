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
import { OpportunityWorkflowForm } from "@/components/opportunities/opportunity-workflow-form";

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
          />
   
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="col-span-1 lg:col-span-2">
                <DetailPageShell>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                        <DetailSummaryCard label="Stage" value={<OpportunityStageBadge stage={opportunity.stage} />} />
                        <DetailSummaryCard label="Health" value={<OpportunityHealthBadge {...workflowOpp} />} />
                        <DetailSummaryCard label="Value" value={formattedValue} />
                        <DetailSummaryCard label="Next Step Due" value={opportunity.nextStepDueDate?.toLocaleDateString() || "-"} />
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
            <div className="col-span-1">
                <OpportunityWorkflowForm opportunity={opportunity} />
            </div>
          </div>
        </>
      );
}
