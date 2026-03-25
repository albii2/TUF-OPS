import { prisma } from "@/lib/prisma";

async function getOrganization(id: string) {
  return await prisma.organization.findUnique({
    where: { id: parseInt(id, 10) },
  });
}

export default async function OrganizationDetailsPage({ params }: { params: { id: string } }) {
  const organization = await getOrganization(params.id);

  if (!organization) {
    return <p>Organization not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">{organization.name}</h2>
      </div>
      <p>Zoho ID: {organization.zoho_account_id}</p>
    </div>
  );
}
