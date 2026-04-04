import { getOrganization } from "@/lib/organizations/queries";
import { getAssignableUsers } from "@/lib/users/queries";
import { PageHeader } from "@/components/ui/page-header";
import { RecordNotFoundState } from "@/components/state/record-not-found-state";
import { EditOrganizationForm } from "@/components/organizations/edit-organization-form";

export default async function EditOrganizationPage({ params }: { params: { id: string } }) {
    const organization = await getOrganization(parseInt(params.id, 10));
    const users = await getAssignableUsers();

    if (!organization) {
        return (
            <RecordNotFoundState
                recordLabel="Program"
                backHref="/organizations"
            />
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Edit ${organization.name}`}
                description="Update the account record and maintain clean organizational data."
            />

            <EditOrganizationForm
                organization={organization}
                assignableUsers={users}
            />
        </div>
    );
}
