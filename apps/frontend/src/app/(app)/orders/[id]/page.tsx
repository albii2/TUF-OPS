
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { RecordNotFoundState } from "@/components/state/record-not-found-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

async function getOrder(id: string) {
    return await prisma.order.findUnique({
        where: { id: parseInt(id, 10) },
        include: {
            opportunity: {
                include: {
                    organization: true,
                    owner: true,
                }
            }
        }
    });
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
    const order = await getOrder(params.id);

    if (!order) {
        return <RecordNotFoundState recordLabel="Order" backHref="/orders" />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Order ${order.orderNumber}`}
                description={`Created on ${order.createdAt.toLocaleDateString()}`}
            />
            <Card>
                <CardHeader>
                    <CardTitle>Order Details</CardTitle>
                    <CardDescription>For opportunity: {order.opportunity.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div><span className="font-semibold">Status:</span> <Badge>{order.status}</Badge></div>
                    <div><span className="font-semibold">Organization:</span> {order.opportunity.organization.name}</div>
                    <div><span className="font-semibold">Value:</span> ${order.opportunity.estimated_value?.toLocaleString()}</div>
                    <div><span className="font-semibold">Owner:</span> {order.opportunity.owner?.name}</div>
                </CardContent>
            </Card>
        </div>
    );
}
