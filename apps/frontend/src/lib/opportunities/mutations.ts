'use server'

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";

// NOTE: This file previously contained updateOpportunityWorkflow, which was moved to a more specific action file.

export async function updateOpportunityOwner(input: {
    id: number;
    ownerId?: number | null;
  }) {
    const session = await requireSession();

    const user = session.user;

    if (user.role === 'rep') {
        throw new Error("Unauthorized: Reps cannot reassign opportunities.");
    }

    if (user.role === 'director') {
        const subordinates = await prisma.user.findMany({
            where: { managerId: user.id },
            select: { id: true },
        });
        const subordinateIds = subordinates.map(s => s.id);
        const allowedOwnerIds = [user.id, ...subordinateIds];

        if (input.ownerId && !allowedOwnerIds.includes(input.ownerId)) {
            throw new Error("Unauthorized: Directors can only assign to themselves or their direct reports.");
        }
    }

    // Admins have no restrictions

    const updated = await prisma.opportunity.update({
      where: { id: input.id },
      data: {
        ownerId: input.ownerId,
      },
    });
  
    revalidatePath(`/opportunities/${input.id}`);
    revalidatePath("/opportunities");
    revalidatePath("/dashboard");

    return updated;
  }
