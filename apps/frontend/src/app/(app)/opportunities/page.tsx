import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageActions } from "@/components/ui/page-actions";
import { prisma } from "@/lib/prisma";

async function getOpportunities() {
  return await prisma.opportunity.findMany();
}

export default async function OpportunitiesPage() {
  const opportunities = await getOpportunities();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Opportunities"
        description="Track deals, active pursuits, and next sales actions."
        actions={
          <PageActions>
            <Button asChild>
              <Link href="/opportunities/new">New Opportunity</Link>
            </Button>
          </PageActions>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {opportunities.map(opp => (
          <div key={opp.id} className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold">
              <Link href={`/opportunities/${opp.id}`} className="hover:underline">
                {opp.name}
              </Link>
            </h2>
            <p>Stage: {opp.stage}</p>
            <p>Value: ${opp.estimated_value?.toLocaleString() || 'N/A'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
