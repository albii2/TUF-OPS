'use client'

import { useEffect, useState } from 'react';
import { requireSession } from "@/lib/auth/session";
import { getMyOrganizations } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "@/components/organizations/columns";
import { Organization, User } from "@prisma/client";

export type OrganizationWithOwner = Organization & { owner: User | null };

export default function MyOrganizationsPage() {
    const [organizations, setOrganizations] = useState<OrganizationWithOwner[]>([]);

    useEffect(() => {
        async function fetchData() {
            const orgs = await getMyOrganizations();
            setOrganizations(orgs as OrganizationWithOwner[]);
        }
        fetchData();
    }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Organizations"
        description="The accounts you own and are responsible for."
      />
      <DataTable 
        columns={columns}
        data={organizations} 
        searchKey="name"
      />
    </div>
  );
}
