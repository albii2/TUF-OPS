import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { DetailPageShell } from "@/components/detail/detail-page-shell";
import { DetailSection } from "@/components/detail/detail-section";
import { DetailFieldList } from "@/components/detail/detail-field-list";
import { DetailField } from "@/components/detail/detail-field";
import Link from "next/link";

async function getOrganization(id: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: parseInt(id, 10) },
    include: { opportunities: true },
  });

  if (!organization) {
    notFound();
  }
  return organization;
}

export default async function OrganizationDetailsPage({ params }: { params: { id: string } }) {
  const organization = await getOrganization(params.id);

  return (
    <DetailPageShell>
      <PageHeader title={organization.name} />

      <DetailSection title="Key Information">
        <DetailFieldList>
          <DetailField label="Zoho Account ID">
            {organization.zoho_account_id || "-"}
          </DetailField>
        </DetailFieldList>
      </DetailSection>

      <DetailSection title={`Linked Opportunities (${organization.opportunities.length})`}>
        {organization.opportunities.length > 0 ? (
          <ul className="space-y-2">
            {organization.opportunities.map(opp => (
              <li key={opp.id} className="rounded-md p-3 hover:bg-muted">
                <Link href={`/opportunities/${opp.id}`} className="font-semibold">
                  {opp.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No opportunities are linked to this organization.</p>
        )}
      </DetailSection>
    </DetailPageShell>
  );
}
