import Link from "next/link";
import { getOrganization } from "@/lib/organizations/queries";
import { getAssignableUsers } from "@/lib/users/queries";
import { PageHeader } from "@/components/ui/page-header";
import { PageActions } from "@/components/ui/page-actions";
import { Button } from "@/components/ui/button";
import { DetailPageShell } from "@/components/detail/detail-page-shell";
import { DetailSection } from "@/components/detail/detail-section";
import { DetailFieldList } from "@/components/detail/detail-field-list";
import { DetailField } from "@/components/detail/detail-field";
import { OrganizationOwnerCard } from "@/components/organizations/organization-owner-card";
import { OwnerBadge } from "@/components/shared/owner-badge";
import { RecordNotFoundState } from "@/components/state/record-not-found-state";
import { OrganizationStatusBadge } from "@/components/organizations/organization-status-badge";
import { OrganizationOpportunitiesList } from "@/components/organizations/OrganizationOpportunitiesList";

export default async function OrganizationDetailsPage({ params }: { params: { id: string } }) {
  const organization = await getOrganization(parseInt(params.id, 10));
  
  if (!organization) {
    return <RecordNotFoundState recordLabel="Organization" backHref="/organizations" />;
  }
  
  const users = await getAssignableUsers();

  return (
    <DetailPageShell>
      <PageHeader 
        title={organization.name}
        actions={
            <PageActions>
                <Link href={`/organizations/${organization.id}/edit`}>
                    <Button>Edit Organization</Button>
                </Link>
            </PageActions>
        }
      />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="col-span-1 lg:col-span-2">
                <DetailSection title="Key Information">
                    <DetailFieldList>
                        <DetailField label="Status">
                            <OrganizationStatusBadge status={organization.status} />
                        </DetailField>
                        <DetailField label="Owner">
                            <OwnerBadge ownerName={organization.owner?.name} />
                        </DetailField>
                        <DetailField label="Zoho Account ID">
                            {organization.zoho_account_id || "-"}
                        </DetailField>
                    </DetailFieldList>
                </DetailSection>

                <DetailSection title={`Linked Opportunities (${organization.opportunities.length})`}>
                    <OrganizationOpportunitiesList opportunities={organization.opportunities} />
                </DetailSection>
            </div>
            <div className="col-span-1">
                <OrganizationOwnerCard organization={organization} users={users} />
            </div>
        </div>
    </DetailPageShell>
  );
}
