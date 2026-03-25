import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageActions } from "@/components/ui/page-actions";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

async function getOrganizations(page: number, limit: number) {
  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.organization.count(),
  ]);
  return { organizations, total };
}

export default async function OrganizationsPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = parseInt(searchParams.page || "1", 10);
  const limit = 10;
  const { organizations, total } = await getOrganizations(page, limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizations"
        description="Manage schools, teams, and institutional accounts."
        actions={
          <PageActions>
            <Button asChild>
              <Link href="/organizations/new">New Organization</Link>
            </Button>
          </PageActions>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {organizations.map((org) => (
          <Card key={org.id}>
            <CardHeader>
              <CardTitle>
                <Link href={`/organizations/${org.id}`} className="hover:underline">
                  {org.name}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Zoho ID: {org.zoho_account_id}</p>
              <Link href={`/organizations/${org.id}`} className="text-blue-500 hover:underline mt-4 block">
                View Details
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center items-center space-x-2 mt-8">
        <Button asChild disabled={page === 1}>
          <Link href={`/organizations?page=${page - 1}`}>Previous</Link>
        </Button>
        <span>
          Page {page} of {Math.ceil(total / limit)}
        </span>
        <Button asChild disabled={page * limit >= total}>
          <Link href={`/organizations?page=${page + 1}`}>Next</Link>
        </Button>
      </div>
    </div>
  );
}
