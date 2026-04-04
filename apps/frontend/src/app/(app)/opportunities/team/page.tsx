import { requireSession } from "@/lib/auth/session";
import { findTeamOpportunities } from "@/lib/opportunities/queries";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { getTeamColumns } from "@/components/opportunities/team-columns";
import { getAssignableUsers } from "@/lib/users/queries";
import { User } from "@prisma/client";
import { Opportunity, Program } from "@prisma/client";

export type OpportunityWithProgram = Opportunity & { 
    owner: User | null; 
    program: Program;
};

export default async function TeamOpportunitiesPage() {
    const session = await requireSession();
    const user = session.user;

    if (user.role !== 'director') {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Unauthorized"
                    description="You are not authorized to view this page."
                />
            </div>
        );
    }

    const opportunities = await findTeamOpportunities(parseInt(user.id));
    const assignableUsers = await getAssignableUsers();

    const columns = getTeamColumns(assignableUsers);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Team Opportunities"
                description="All opportunities visible to you and your team."
            />
            <DataTable 
                columns={columns}
                data={opportunities as OpportunityWithProgram[]} 
                searchKey="name"
            />
        </div>
    );
}
