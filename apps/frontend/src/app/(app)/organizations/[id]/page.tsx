import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";

async function getOrganization(id: string) {
  return await prisma.organization.findUnique({
    where: { id: parseInt(id, 10) },
  });
}

export default async function OrganizationDetailsPage({ params }: { params: { id: string } }) {
  const organization = await getOrganization(params.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={organization?.name || "Organization"}
      />
      <p>Zoho ID: {organization?.zoho_account_id}</p>
    </div>
  );
}
