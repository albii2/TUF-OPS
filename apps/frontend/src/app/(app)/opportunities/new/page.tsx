import { PageHeader } from "@/components/ui/page-header";
import { NewOpportunityForm } from "@/components/opportunities/new-opportunity-form";
import { prisma } from "@/lib/prisma";

async function getOrganizations() {
  return await prisma.organization.findMany();
}

export default async function NewOpportunityPage() {
  const organizations = await getOrganizations();

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Opportunity"
        description="Create a new opportunity and connect it to the appropriate organization."
      />
      <NewOpportunityForm organizations={organizations} />
    </div>
  );
}
