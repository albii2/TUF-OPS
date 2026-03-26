import { PageHeader } from "@/components/ui/page-header";
import { DetailPageShell } from "@/components/detail/detail-page-shell";
import { DetailSection } from "@/components/detail/detail-section";
import { DetailFieldList } from "@/components/detail/detail-field-list";
import { DetailField } from "@/components/detail/detail-field";
import Link from "next/link";
import { getAssignableUsers } from "@/lib/users/queries";
import { OrganizationOwnerCard } from "@/components/organizations/organization-owner-card";
import { OwnerBadge } from "@/components/shared/owner-badge";
import { getOrganization } from "@/lib/organizations/queries";

export default async function OrganizationDetailsPage({ params }: { params: { id: string } }) {
  const organization = await getOrganization(parseInt(params.id, 10));
  const users = await getAssignableUsers();

  return (
    <DetailPageShell>
      <PageHeader title={organization.name} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="col-span-1 lg:col-span-2">
                <DetailSection title="Key Information">
                    <DetailFieldList>
                    <DetailField label="Zoho Account ID">
                        {organization.zoho_account_id || "-"}
                    </DetailField>
                    <DetailField label="Owner">
                        <OwnerBadge ownerName={organization.owner?.name} />
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
            </div>
            <div className="col-span-1">
                <OrganizationOwnerCard organization={organization} users={users} />
            </div>
        </div>
    </DetailPageShell>
  );
}
