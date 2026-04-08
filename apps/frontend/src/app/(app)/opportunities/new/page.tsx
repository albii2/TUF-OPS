import { PageHeader } from "@/components/ui/page-header";
import { NewOpportunityForm } from "@/components/opportunities/new-opportunity-form";
import { prisma } from "@/lib/prisma";
import { withDatabaseFallback } from "@/lib/runtime/database-health";

async function getOrganizations() {
  return withDatabaseFallback(
    "getOrganizationsForNewOpportunity",
    () => prisma.organization.findMany(),
    [],
  );
}

export default async function NewOpportunityPage() {
  const organizations = await getOrganizations();
  const isReadOnly = organizations.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Opportunity"
        description="Create a new opportunity and connect it to the appropriate organization."
      />
      <NewOpportunityForm organizations={organizations} readOnly={isReadOnly} />
    </div>
  );
}
