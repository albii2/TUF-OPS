
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "@/components/organizations/columns";
import { Organization, User } from "@prisma/client";
import { EmptyListState } from "@/components/state/empty-list-state";
import { getMyOrganizations } from './actions';

export type OrganizationWithOwner = Organization & { owner: User | null };

export default async function MyOrganizationsPage() {
    const organizations = await getMyOrganizations() as OrganizationWithOwner[];

    if (organizations.length === 0) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="My Organizations"
                    description="These are the organizations that you own."
                />
                <EmptyListState
                    resourceName="Organizations"
                    description="You have not been assigned any organizations yet."
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Organizations"
                description="These are the organizations that you own."
            />
            <DataTable 
                columns={columns}
                data={organizations} 
                searchKey="name"
            />
        </div>
    );
}
