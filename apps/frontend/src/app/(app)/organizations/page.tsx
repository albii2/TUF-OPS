import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageActions } from "@/components/ui/page-actions";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "@/components/organizations/columns";
import { Organization } from "@prisma/client";
import { EmptyListState } from "@/components/state/empty-list-state";

export type OrganizationWithOwner = Organization & { owner: { name: string | null } | null };

async function getOrganizations(): Promise<OrganizationWithOwner[]> {
  // For now, we fetch all. Later, this will be paginated.
  return await prisma.organization.findMany({ include: { owner: true } });
}

export default async function OrganizationsPage() {
  const organizations = await getOrganizations();

  if (organizations.length === 0) {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Organizations"
                description="Manage schools, teams, and institutional accounts."
            />
            <EmptyListState
                resourceName="Organizations"
                description="Create your first organization to start tracking schools, teams, and accounts."
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
        description="Manage schools, teams, and institutional accounts."
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
        rowHrefPrefix="/organizations/"
      />
    </div>
  );
}
