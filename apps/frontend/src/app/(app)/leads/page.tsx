import { requireSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getLeads } from "@/lib/leads/queries";
import { getAssignableUsers } from "@/lib/users/queries";
import { LeadTable } from "@/components/leads/lead-table";
import { LeadQueueEntry } from "@/types/lead";

export default async function LeadsPage() {
  const session = await requireSession();

  if (session.user.role === "rep") {
    redirect("/forbidden");
  }

  const leads = await getLeads();
  const assignableUsers = await getAssignableUsers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lead Queue"
        description="View, assign, and convert new leads."
        actions={
            session.user.role === 'admin' && (
                <Button asChild>
                    <Link href="/leads/new">New Lead</Link>
                </Button>
            )
        }
      />
      <LeadTable 
        leads={leads as LeadQueueEntry[]} 
        assignableUsers={assignableUsers} 
        userRole={session.user.role || 'rep'} 
      />
    </div>
  );
}
