import { getOrders } from "@/lib/orders/queries";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "@/components/orders/order-columns";

export default async function OrdersPage() {
    const orders = await getOrders();

    return (
        <div className="space-y-6">
            <PageHeader
                title="Orders"
                description="Review and manage all post-sale fulfillment orders."
            />
            <DataTable 
                columns={columns} 
                data={orders} 
                searchKey="opportunity.organization.name"
                emptyStateMessage="No orders found. Create an order from a 'Closed Won' opportunity to get started."
            />
        </div>
    )
}
