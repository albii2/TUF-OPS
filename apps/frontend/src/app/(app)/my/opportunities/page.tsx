'use client'

import { useEffect, useState } from 'react';
import { requireSession } from "@/lib/auth/session";
import { getMyOpportunities } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "@/components/opportunities/columns";
import { Opportunity, User, Organization } from "@prisma/client";

export type OpportunityWithOwner = Opportunity & { 
    owner: User | null; 
    organization: Organization;
};

export default function MyOpportunitiesPage() {
    const [opportunities, setOpportunities] = useState<OpportunityWithOwner[]>([]);

    useEffect(() => {
        async function fetchData() {
            const opps = await getMyOpportunities();
            setOpportunities(opps as OpportunityWithOwner[]);
        }
        fetchData();
    }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Opportunities"
        description="Your personal book of business. Focus on what you can control."
      />
      <DataTable 
        columns={columns}
        data={opportunities} 
        searchKey="name"
      />
    </div>
  );
}
