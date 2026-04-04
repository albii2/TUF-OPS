import { PageHeader } from "@/components/ui/page-header";
import { NewLeadForm } from "@/components/leads/new-lead-form";
import { requireSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function NewLeadPage() {
  const session = await requireSession();

  if (session.user.role !== "admin") {
    redirect("/forbidden");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Lead"
        description="Create a new lead for the sales team."
      />
      <NewLeadForm />
    </div>
  );
}
