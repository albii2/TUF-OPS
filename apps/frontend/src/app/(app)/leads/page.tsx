import { PageHeader } from "@/components/ui/page-header";
import { LeadTable } from "@/components/leads/lead-table";
import { getLeads } from "@/lib/leads/queries";

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Leads"
        description="A list of all the leads in the system."
      />
      <LeadTable leads={leads as any} />
    </div>
  );
}
