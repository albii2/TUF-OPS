'use server'

import { prisma } from "@/lib/prisma";
import { User } from "@prisma/client";

/**
 * Retrieves opportunities based on the user's role and hierarchy.
 * - Admins see all opportunities.
 * - Directors see their own opportunities, their team's opportunities, and unassigned leads.
 * - Reps see only their own assigned opportunities.
 */
export async function getVisibleOpportunities(user: User) {
    const standardIncludes = { owner: true, organization: true };

    if (user.role === 'admin') {
        return await prisma.opportunity.findMany({ include: standardIncludes });
    }

    if (user.role === 'director') {
        const subordinateIds = await prisma.user.findMany({
            where: { managerId: user.id },
            select: { id: true },
        }).then(users => users.map(u => u.id));

        const visibleOwnerIds = [user.id, ...subordinateIds];

        return await prisma.opportunity.findMany({
            where: {
                OR: [
                    { ownerId: { in: visibleOwnerIds } },
                    { ownerId: null } // Directors can see unassigned leads
                ]
            },
            include: standardIncludes
        });
    }

    // Default to rep visibility
    return await prisma.opportunity.findMany({
        where: { ownerId: user.id },
        include: standardIncludes
    });
}
