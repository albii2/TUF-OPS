
import { getOpportunity } from "@/lib/opportunities/queries";
import { RecordNotFoundState } from "@/components/state/record-not-found-state";
import { createOrder } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function NewOrderPage({ params }: { params: { opportunityId: string } }) {
    const opportunity = await getOpportunity(params.opportunityId);

    if (!opportunity) {
        return <RecordNotFoundState recordLabel="Opportunity" backHref="/opportunities" />;
    }

    // You cannot create an order for an opportunity that already has one.
    if (opportunity.order) {
        return (
            <div className="p-6 border rounded-lg bg-white">
                <h3 className="text-lg font-semibold">Order Already Exists</h3>
                <p className="text-muted-foreground">This opportunity already has an associated order.</p>
            </div>
        )
    }

    const createOrderWithId = createOrder.bind(null, opportunity.id);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Order</CardTitle>
                    <CardDescription>You are about to create a new order for the opportunity: <strong>{opportunity.name}</strong>.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>This will finalize the deal and move it into the production workflow. This action cannot be undone.</p>
                </CardContent>
                <CardFooter>
                    <form action={createOrderWithId}>
                        <Button>Confirm and Start Order</Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
}
