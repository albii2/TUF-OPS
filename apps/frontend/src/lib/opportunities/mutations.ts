'use server'

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";

// NOTE: This file previously contained updateOpportunityWorkflow, which was moved to a more specific action file.

type AssignmentActor = {
    id: string | number;
    role: "admin" | "director" | "rep";
};

export async function validateAssignment(
    user: AssignmentActor,
    targetOwnerId: number | null
) {
    const actorId = typeof user.id === "string" ? parseInt(user.id, 10) : user.id;

    if (Number.isNaN(actorId)) {
        throw new Error("Invalid actor id.");
    }

    if (user.role === "rep") {
        throw new Error("Unauthorized: Reps cannot reassign opportunities.");
    }

    if (targetOwnerId === null || user.role === "admin") {
        return { allowed: true };
    }

    if (user.role === "director") {
        const subordinates = await prisma.user.findMany({
            where: { managerId: actorId },
            select: { id: true },
        });
        const subordinateIds = subordinates.map((s) => s.id);
        const allowedOwnerIds = [actorId, ...subordinateIds];

        if (!allowedOwnerIds.includes(targetOwnerId)) {
            throw new Error("Unauthorized: Directors can only assign to themselves or their direct reports.");
        }
    }

    return { allowed: true };
}

export async function updateOpportunityOwner(input: {
    id: number;
    ownerId?: number | null;
  }) {
    const session = await requireSession();

    const user = session.user;

    const normalizedOwnerId = input.ownerId ?? null;

    if (normalizedOwnerId !== null) {
        const targetOwner = await prisma.user.findUnique({
            where: { id: normalizedOwnerId },
            select: { id: true },
        });

        if (!targetOwner) {
            throw new Error("Owner not found.");
        }
    }

    await validateAssignment(user, normalizedOwnerId);

    const updated = await prisma.opportunity.update({
      where: { id: input.id },
      data: {
        ownerId: normalizedOwnerId,
      },
    });
  
    revalidatePath(`/opportunities/${input.id}`);
    revalidatePath("/opportunities");
    revalidatePath("/dashboard");

    return updated;
  }
