import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageActions } from "@/components/ui/page-actions";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "@/components/organizations/columns";
import { Organization } from "@prisma/client";

async function getOrganizations() {
  // For now, we fetch all. Later, this will be paginated.
  return await prisma.organization.findMany();
}

export default async function OrganizationsPage() {
  const organizations = await getOrganizations();

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
