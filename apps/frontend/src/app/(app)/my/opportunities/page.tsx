
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageActions } from "@/components/ui/page-actions";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "@/components/opportunities/columns";
import { Opportunity, User, Organization } from "@prisma/client";
import { EmptyListState } from "@/components/state/empty-list-state";
import { getMyOpportunities } from './actions';

export type OpportunityWithOwner = Opportunity & { 
    owner: User | null; 
    organization: Organization;
};

export default async function MyOpportunitiesPage() {
    const opportunities = await getMyOpportunities() as OpportunityWithOwner[];

  if (opportunities.length === 0) {
    return (
        <div className="space-y-6">
            <PageHeader
                title="My Opportunities"
                description="These are the opportunities that you own."
            />
            <EmptyListState
                resourceName="Opportunities"
                description="You have not been assigned any opportunities yet."
            />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Opportunities"
        description="These are the opportunities that you own."
      />
      <DataTable 
        columns={columns}
        data={opportunities} 
        searchKey="name"
      />
    </div>
  );
}
