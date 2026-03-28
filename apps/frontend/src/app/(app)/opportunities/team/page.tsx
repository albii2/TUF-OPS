import { getTeamOpportunities } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "@/components/opportunities/columns";
import { Opportunity, User, Organization } from "@prisma/client";

export type OpportunityWithOwner = Opportunity & { 
    owner: User | null; 
    organization: Organization;
};

export default async function TeamOpportunitiesPage() {
    const opportunities = await getTeamOpportunities();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Opportunities"
        description="A view of all deals owned by you and your direct reports."
      />
      <DataTable 
        columns={columns}
        data={opportunities as OpportunityWithOwner[]} 
        searchKey="name"
      />
    </div>
  );
}
