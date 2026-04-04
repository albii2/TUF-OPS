import { PageHeader } from "@/components/ui/page-header";
import { NewLeadForm } from "@/components/leads/new-lead-form";

export default function NewLeadPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="New Lead"
        description="Create a new lead in the system."
      />
      <NewLeadForm />
    </div>
  );
}
