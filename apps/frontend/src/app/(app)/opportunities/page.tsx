'use client'

import { useEffect, useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageActions } from "@/components/ui/page-actions";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "@/components/opportunities/columns";
import { Opportunity, User, Program } from "@prisma/client";
import { EmptyListState } from "@/components/state/empty-list-state";
import { getOpportunities } from './actions';

export type OpportunityWithProgram = Opportunity & { 
    owner: User | null; 
    program: Program;
};

export default function OpportunitiesPage() {
    const [opportunities, setOpportunities] = useState<OpportunityWithProgram[]>([]);

    useEffect(() => {
        async function fetchData() {
            const opps = await getOpportunities();
            setOpportunities(opps as any as OpportunityWithProgram[]);
        }
        fetchData();
    }, []);

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
        searchKey="name"
      />
    </div>
  );
}
