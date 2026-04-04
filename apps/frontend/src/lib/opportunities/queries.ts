import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { getTeamOpportunityFilter } from "@/lib/auth/visibility";

export async function getMyOpportunities(repId: number) {
    return prisma.opportunity.findMany({
        where: {
            ownerId: repId,
        },
        include: {
            organization: true,
        },
        orderBy: {
            updated_at: 'desc',
        }
    });
}

export async function findTeamOpportunities(directorId: number) {
    const where = await getTeamOpportunityFilter(directorId, true);
    return prisma.opportunity.findMany({
        where,
        include: {
            owner: true,
            organization: true,
        },
        orderBy: {
            updated_at: 'desc',
        }
    });
}

export async function getOpportunity(id: string) {
    const session = await requireSession();
    const opportunityId = parseInt(id, 10);
    const userId = parseInt(session.user.id, 10);

    if (Number.isNaN(opportunityId) || Number.isNaN(userId)) {
        notFound();
    }

    let whereClause: {
        id: number;
        OR?: Array<{ ownerId: number | null } | { ownerId: { in: number[] } }>;
        ownerId?: number;
    } = { id: opportunityId };

    if (session.user.role === "director") {
        const subordinates = await prisma.user.findMany({
            where: { managerId: userId },
            select: { id: true },
        });
        const subordinateIds = subordinates.map((subordinate) => subordinate.id);
        const teamOwnerIds = [userId, ...subordinateIds];

        whereClause = {
            id: opportunityId,
            OR: [{ ownerId: { in: teamOwnerIds } }, { ownerId: null }],
        };
    } else if (session.user.role === "rep") {
        whereClause = {
            id: opportunityId,
            ownerId: userId,
        };
    }

    const opportunity = await prisma.opportunity.findFirst({
        where: whereClause,
        include: { 
            organization: { include: { contacts: true } }, 
            owner: true, 
            uniformOrder: true,
            activities: { include: { user: true, contact: true }, orderBy: { createdAt: 'desc' } },
        },
    });
    
    if (!opportunity || !opportunity.organization) {
        notFound();
    }
    return opportunity;
}
