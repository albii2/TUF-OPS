'use client'

import { useEffect, useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageActions } from "@/components/ui/page-actions";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "@/components/organizations/columns";
import { Organization, User } from "@prisma/client";
import { EmptyListState } from "@/components/state/empty-list-state";
import { getOrganizations } from './actions';

export type OrganizationWithOwner = Organization & { owner: User | null };

export default function OrganizationsPage() {
    const [organizations, setOrganizations] = useState<OrganizationWithOwner[]>([]);

    useEffect(() => {
        async function fetchData() {
            const orgs = await getOrganizations();
            setOrganizations(orgs as OrganizationWithOwner[]);
        }
        fetchData();
    }, []);

  if (organizations.length === 0) {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Organizations"
                description="Manage accounts, associated deals, and key contacts."
            />
            <EmptyListState
                resourceName="Organizations"
                description="Create your first organization to begin managing accounts."
                action={
                    <Button asChild>
                        <Link href="/organizations/new">New Organization</Link>
                    </Button>
                }
            />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizations"
        description="Manage accounts, associated deals, and key contacts."
        actions={
          <PageActions>
            <Link href="/organizations/new">
              <Button>New Organization</Button>
            </Link>
          </PageActions>
        }
      />
      <DataTable 
        columns={columns}
        data={organizations} 
        searchKey="name"
      />
    </div>
  );
}
