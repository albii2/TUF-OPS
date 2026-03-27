'use client'

import { useEffect, useState } from 'react';
import { getOpportunities } from "../actions"; // We can reuse the main action, as it's now role-aware
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "@/components/opportunities/columns";
import { Opportunity, User, Organization } from "@prisma/client";

export type OpportunityWithOwner = Opportunity & { 
    owner: User | null; 
    organization: Organization;
};

export default function TeamOpportunitiesPage() {
    const [opportunities, setOpportunities] = useState<OpportunityWithOwner[]>([]);

    useEffect(() => {
        async function fetchData() {
            const opps = await getOpportunities();
            setOpportunities(opps as OpportunityWithOwner[]);
        }
        fetchData();
    }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Opportunities"
        description="A view of all deals owned by you and your direct reports."
      />
      <DataTable 
        columns={columns}
        data={opportunities} 
        searchKey="name"
      />
    </div>
  );
}
