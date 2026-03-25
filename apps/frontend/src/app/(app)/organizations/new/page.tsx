import { PageHeader } from "@/components/ui/page-header";
import { NewOrganizationForm } from "@/components/organizations/new-organization-form";

export default function NewOrganizationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Organization"
        description="Create a new organization record for a school, team, or account."
      />
      <NewOrganizationForm />
    </div>
  );
}
