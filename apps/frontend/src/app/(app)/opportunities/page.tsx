import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageActions } from "@/components/ui/page-actions";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "@/components/opportunities/columns";
import { Opportunity } from "@prisma/client";
import { EmptyListState } from "@/components/state/empty-list-state";

export type OpportunityWithOwner = Opportunity & { owner: { name: string | null } | null };

async function getOpportunities(): Promise<OpportunityWithOwner[]> {
  return await prisma.opportunity.findMany({ include: { owner: true } });
}

export default async function OpportunitiesPage() {
  const opportunities = await getOpportunities();

  if (opportunities.length === 0) {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Opportunities"
                description="Track deals, active pursuits, and next sales actions."
            />
            <EmptyListState
                resourceName="Opportunities"
                description="Create your first opportunity to begin building your pipeline."
                action={
                    <Button asChild>
                        <Link href="/opportunities/new">New Opportunity</Link>
                    </Button>
                }
            />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Opportunities"
        description="Track deals, active pursuits, and next sales actions."
        actions={
          <PageActions>
            <Link href="/opportunities/new">
              <Button>New Opportunity</Button>
            </Link>
          </PageActions>
        }
      />
      <DataTable 
        columns={columns}
        data={opportunities} 
        rowHrefPrefix="/opportunities/"
      />
    </div>
  );
}
