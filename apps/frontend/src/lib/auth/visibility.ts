'use server'

import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

type VisibilityUser = {
    id: string | number;
    role: UserRole;
};

type VisibilityOptions = {
    includeUnassignedForDirector?: boolean;
};

/**
 * Retrieves opportunities based on the user's role and hierarchy.
 * - Admins see all opportunities.
 * - Directors see their own opportunities, their team's opportunities, and unassigned leads.
 * - Reps see only their own assigned opportunities.
 */
export async function getVisibleOpportunities(
    user: VisibilityUser,
    options?: VisibilityOptions
) {
    const standardIncludes = { owner: true, organization: true };
    const userId = typeof user.id === "string" ? parseInt(user.id, 10) : user.id;

    if (Number.isNaN(userId)) {
        throw new Error("Invalid user id.");
    }

    if (user.role === 'admin') {
        return await prisma.opportunity.findMany({ include: standardIncludes });
    }

    if (user.role === 'director') {
        const includeUnassigned = options?.includeUnassignedForDirector ?? true;
        const subordinateIds = await prisma.user.findMany({
            where: { managerId: userId },
            select: { id: true },
        }).then(users => users.map(u => u.id));

        const visibleOwnerIds = [userId, ...subordinateIds];
        const directorVisibilityFilters = [{ ownerId: { in: visibleOwnerIds } }];

        if (includeUnassigned) {
            directorVisibilityFilters.push({ ownerId: null });
        }

        return await prisma.opportunity.findMany({
            where: {
                OR: directorVisibilityFilters
            },
            include: standardIncludes
        });
    }

    // Default to rep visibility
    return await prisma.opportunity.findMany({
        where: { ownerId: userId },
        include: standardIncludes
    });
}
