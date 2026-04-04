'use client'

import { useTransition } from "react";
import { createOrder } from "@/app/(app)/orders/_actions/createOrder";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CreateOrderButton({ opportunityId }: { opportunityId: number }) {
    let [isPending, startTransition] = useTransition();

    const handleCreateOrder = () => {
        startTransition(() => {
            toast.info("Creating order...");
            createOrder({ opportunityId })
                .catch((err) => {
                    toast.error("Failed to create order.");
                });
        });
    }

    return (
        <Button onClick={handleCreateOrder} disabled={isPending}>
            Create Uniform Order
        </Button>
    )
}