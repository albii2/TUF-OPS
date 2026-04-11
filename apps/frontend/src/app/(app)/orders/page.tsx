
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "./columns";
import { EmptyListState } from "@/components/state/empty-list-state";

async function getOrders() {
    return await prisma.order.findMany({
        include: {
            opportunity: {
                include: {
                    organization: true,
                }
            }
        },
        orderBy: {
            createdAt: "desc",
        }
    });
}

export default async function OrdersPage() {
    const orders = await getOrders();

    if (orders.length === 0) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Orders"
                    description="Manage and track all customer orders."
                />
                <EmptyListState
                    resourceName="Orders"
                    description="When an opportunity is won, it will appear here as an order ready for processing."
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Orders"
                description="Manage and track all customer orders."
            />
            <DataTable columns={columns} data={orders} searchKey="orderNumber" />
        </div>
    );
}
