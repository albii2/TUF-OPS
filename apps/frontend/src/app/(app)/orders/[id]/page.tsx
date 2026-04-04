
import { getOrderById } from "@/lib/orders/queries";
import { PageHeader } from "@/components/ui/page-header";
import { RecordNotFoundState } from "@/components/state/record-not-found-state";
import { OrderStatusTracker } from "@/components/orders/order-status-tracker";
import { OrderItemCard } from "@/components/orders/order-item-card";
import { RequestMockupForm } from "@/components/orders/request-mockup-form";
import { RequestSampleForm } from "@/components/orders/request-sample-form";
import { RosterUploadForm } from "@/components/orders/roster-upload-form";
import { GenerateInvoiceForm } from "@/components/orders/generate-invoice-form";
import { getAuthSession } from "@/lib/auth/auth";
import { MockupStatusActions } from "@/components/orders/mockup-status-actions";
import { SampleStatusActions } from "@/components/orders/sample-status-actions";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
    const session = await getAuthSession();
    const order = await getOrderById(params.id);

    if (!order) {
        return <RecordNotFoundState recordLabel="Order" backHref="/opportunities" />;
    }

    const mockupRequest = order.opportunity.mockupRequests[0];
    const sampleRequest = order.opportunity.sampleRequests[0];
    const roster = order.roster;
    const invoice = order.opportunity.invoices[0];

    const canGenerateInvoice = 
        (mockupRequest?.status === 'Approved') || 
        (sampleRequest?.status === 'Delivered' || sampleRequest?.status === 'Completed');

    const userIsAdminOrDirector = session?.user.role === 'admin' || session?.user.role === 'director';

    const opportunityForInvoice = {
        ...order.opportunity,
        estimated_value: order.opportunity.estimated_value?.toNumber() ?? 0,
    };

    return (
        <div className="space-y-6">
            <PageHeader 
                title={`Order #${order.id.substring(0, 7)}`}
                description={`Manage the fulfillment process for ${order.opportunity.organization.name}`}
            />

            <OrderStatusTracker orderId={order.id} currentStatus={order.status} />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <OrderItemCard 
                    title="Mockup Request" 
                    status={mockupRequest?.status || "Not Requested"}
                    statusVariant={mockupRequest ? "default" : "outline"}
                >
                    {mockupRequest ? (
                        <div>
                            <p className="text-sm text-muted-foreground">Jersey Number: {mockupRequest.jerseyNumber || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">Logo: {mockupRequest.logo || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">Colors: {mockupRequest.colors || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">Notes: {mockupRequest.notes || "No notes."}</p>
                            {userIsAdminOrDirector && <MockupStatusActions mockupRequestId={mockupRequest.id} currentStatus={mockupRequest.status} />}
                        </div>
                    ) : (
                        <RequestMockupForm opportunityId={order.opportunityId}>
                            <div className="hover:bg-muted p-4 -m-4 rounded-md cursor-pointer">
                                <p>No mockup has been requested for this order yet. Click here to begin the design process.</p>
                            </div>
                        </RequestMockupForm>
                    )}
                </OrderItemCard>
                <OrderItemCard 
                    title="Sample Request" 
                    status={sampleRequest?.status || "Not Requested"}
                    statusVariant={sampleRequest ? "default" : "outline"}
                >
                     {sampleRequest ? (
                        <div>
                            <p className="text-sm text-muted-foreground">Player Name: {sampleRequest.playerName || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">Player Number: {sampleRequest.playerNumber || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">Size: {sampleRequest.size || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">Notes: {sampleRequest.notes || "No notes."}</p>
                            {userIsAdminOrDirector && <SampleStatusActions sampleRequestId={sampleRequest.id} currentStatus={sampleRequest.status} />}
                        </div>
                    ) : (
                        <RequestSampleForm opportunityId={order.opportunityId}>
                            <div className="hover:bg-muted p-4 -m-4 rounded-md cursor-pointer">
                                <p>No sample has been requested for this order yet. Click here to request one.</p>
                            </div>
                        </RequestSampleForm>
                    )}
                </OrderItemCard>
                <OrderItemCard 
                    title="Roster Upload" 
                    status={roster ? "Submitted" : "Not Submitted"}
                    statusVariant={roster ? "default" : "outline"}
                >
                    {roster ? (
                        <a href={roster.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            View Submitted Roster
                        </a>
                    ) : (
                        <RosterUploadForm orderId={order.id}>
                            <div className="hover:bg-muted p-4 -m-4 rounded-md cursor-pointer">
                                <p>The team roster has not been submitted yet. Click here to upload it.</p>
                            </div>
                        </RosterUploadForm>
                    )}
                </OrderItemCard>
                <OrderItemCard 
                    title="Invoice" 
                    status={invoice?.status || "Not Generated"}
                    statusVariant={invoice ? "default" : "outline"}
                >
                    {invoice ? (
                        <div>
                            <p className="text-sm text-muted-foreground">Amount: ${invoice.amount.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">Status: {invoice.status}</p>
                        </div>
                    ) : (
                        <GenerateInvoiceForm opportunity={opportunityForInvoice} disabled={!canGenerateInvoice} disabledReason="An invoice can only be generated after a mockup is approved or a sample has been delivered.">
                            <div className="hover:bg-muted p-4 -m-4 rounded-md cursor-pointer">
                                <p>No invoice has been generated for this order yet. Click here to create one.</p>
                            </div>
                        </GenerateInvoiceForm>
                    )}
                </OrderItemCard>
            </div>
        </div>
    )
}
