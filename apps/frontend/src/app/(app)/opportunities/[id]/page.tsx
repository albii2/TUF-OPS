import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";

async function getOpportunity(id: string) {
  return await prisma.opportunity.findUnique({
    where: { id: parseInt(id, 10) },
  });
}

export default async function OpportunityDetailsPage({ params }: { params: { id: string } }) {
  const opportunity = await getOpportunity(params.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={opportunity?.name || "Opportunity"}
      />
      <p>Stage: {opportunity?.stage}</p>
      <p>Value: ${opportunity?.estimated_value?.toLocaleString() || 'N/A'}</p>
    </div>
  );
}
