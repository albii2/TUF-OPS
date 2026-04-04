'use server'

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getAssignableUsers } from "@/lib/users/queries";

export async function updateOpportunityOwner(opportunityId: number, newOwnerId: number | null) {
    const session = await requireSession();
    const actor = session.user;

    if (actor.role !== 'director') {
        throw new Error('Only directors can reassign opportunities.');
    }

    const assignableUsers = await getAssignableUsers();
    const isAssignable = assignableUsers.some(user => user.id === newOwnerId);
    const isUnassigning = newOwnerId === null;

    if (!isAssignable && !isUnassigning) {
        throw new Error('Cannot assign to a user outside of your team.');
    }

    await prisma.opportunity.update({
        where: { id: opportunityId },
        data: { ownerId: newOwnerId },
    });

    revalidatePath("/opportunities/team");
}
