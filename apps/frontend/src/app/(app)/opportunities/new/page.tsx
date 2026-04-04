import { PageHeader } from "@/components/ui/page-header";
import { NewOpportunityForm } from "@/components/opportunities/new-opportunity-form";
import { prisma } from "@/lib/prisma";

async function getPrograms() {
  return await prisma.program.findMany();
}

export default async function NewOpportunityPage() {
  const programs = await getPrograms();

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Opportunity"
        description="Create a new opportunity and connect it to the appropriate program."
      />
      <NewOpportunityForm programs={programs} />
    </div>
  );
}
