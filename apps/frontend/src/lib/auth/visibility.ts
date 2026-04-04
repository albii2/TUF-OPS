'use server'

import { prisma } from "@/lib/prisma";

type VisibilityUser = {
    id: string | number;
    role: any;
};

type VisibilityOptions = {
    includeUnassignedForDirector?: boolean;
};

export async function getTeamOpportunityFilter(directorId: string | number, includeUnassigned = true) {
    const directorIdNum = typeof directorId === 'string' ? parseInt(directorId, 10) : directorId;
    if (Number.isNaN(directorIdNum)) {
        throw new Error("Invalid director id.");
    }

    const subordinateIds = await prisma.user.findMany({
        where: { managerId: directorIdNum },
        select: { id: true },
    }).then(users => users.map(u => u.id));

    const visibleOwnerIds = [directorIdNum, ...subordinateIds];
    const directorVisibilityFilters: any[] = [{ ownerId: { in: visibleOwnerIds } }];

    if (includeUnassigned) {
        directorVisibilityFilters.push({ ownerId: null });
    }

    return {
        OR: directorVisibilityFilters
    }
}

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
        const where = await getTeamOpportunityFilter(userId, options?.includeUnassignedForDirector ?? true);
        return await prisma.opportunity.findMany({
            where,
            include: standardIncludes
        });
    }

    // Default to rep visibility
    return await prisma.opportunity.findMany({
        where: { ownerId: userId },
        include: standardIncludes
    });
}

