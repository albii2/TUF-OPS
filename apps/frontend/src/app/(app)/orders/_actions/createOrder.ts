'use server'

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createOrderSchema = z.object({
    opportunityId: z.number(),
});

export async function createOrder(input: unknown) {
    const session = await requireSession();
    const { opportunityId } = createOrderSchema.parse(input);

    const opportunity = await prisma.opportunity.findUnique({
        where: { id: opportunityId },
    });

    if (!opportunity) {
        throw new Error("Opportunity not found.");
    }

    if (opportunity.stage !== 'closed_won') {
        throw new Error("Cannot create an order for an opportunity that is not won.");
    }

    // Check if an order already exists for this opportunity to prevent duplicates
    const existingOrder = await prisma.uniformOrder.findFirst({
        where: { opportunityId: opportunityId },
    });

    if (existingOrder) {
        redirect(`/orders/${existingOrder.id}`);
        return;
    }

    const newOrder = await prisma.uniformOrder.create({
        data: {
            opportunityId: opportunityId,
            status: "Pending",
        },
    });

    revalidatePath(`/opportunities/${opportunityId}`);
    redirect(`/orders/${newOrder.id}`);
}