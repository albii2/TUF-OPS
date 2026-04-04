'use server'

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const requestSampleSchema = z.object({
    opportunityId: z.number(),
    notes: z.string().optional(),
    playerName: z.string().optional(),
    playerNumber: z.string().optional(),
    size: z.string().optional(),
});

export async function requestSample(input: unknown) {
    const session = await requireSession();
    const { opportunityId, notes, playerName, playerNumber, size } = requestSampleSchema.parse(input);

    const sample = await prisma.sampleRequest.create({
        data: {
            opportunityId,
            notes,
            playerName,
            playerNumber,
            size,
            status: "Requested",
        }
    });

    revalidatePath(`/orders/.*`, 'page');

    return sample;
}
