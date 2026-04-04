'use server'

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const submitRosterSchema = z.object({
    orderId: z.string(),
    fileUrl: z.string().url(),
});

export async function submitRoster(input: unknown) {
    const session = await requireSession();
    const { orderId, fileUrl } = submitRosterSchema.parse(input);

    const roster = await prisma.rosterUpload.create({
        data: {
            orderId,
            fileUrl,
        }
    });

    revalidatePath(`/orders/${orderId}`);

    return roster;
}
