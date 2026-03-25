import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { DetailPageShell } from "@/components/detail/detail-page-shell";
import { DetailSection } from "@/components/detail/detail-section";
import { DetailFieldList } from "@/components/detail/detail-field-list";
import { DetailField } from "@/components/detail/detail-field";
import { DetailSummaryCard } from "@/components/detail/detail-summary-card";
import { DetailBadgeRow } from "@/components/detail/detail-badge-row";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function getOpportunity(id: string) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: parseInt(id, 10) },
    include: { organization: true },
  });

  if (!opportunity) {
    notFound();
  }
  return opportunity;
}

export default async function OpportunityDetailsPage({ params }: { params: { id: string } }) {
  const opportunity = await getOpportunity(params.id);
  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(opportunity.estimated_value || 0);

  return (
    <DetailPageShell>
      <PageHeader title={opportunity.name} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <DetailSummaryCard label="Stage" value={opportunity.stage} />
        <DetailSummaryCard label="Value" value={formattedValue} />
        <DetailSummaryCard label="Probability" value={`${opportunity.probability || 0}%`} />
        <DetailSummaryCard label="Next Step" value={"Send Invoice"} />
      </div>

      <DetailSection title="Commercial Information">
        <DetailFieldList>
            <DetailField label="Estimated Value">{formattedValue}</DetailField>
            <DetailField label="Probability">{opportunity.probability || 0}%</DetailField>
            <DetailField label="Close Date">{opportunity.close_date?.toLocaleDateString() || "-"}</DetailField>
        </DetailFieldList>
      </DetailSection>

      <DetailSection title="Organization">
        <Link href={`/organizations/${opportunity.organization.id}`} className="font-semibold text-blue-600 hover:underline">
            {opportunity.organization.name}
        </Link>
      </DetailSection>

    </DetailPageShell>
  );
}
