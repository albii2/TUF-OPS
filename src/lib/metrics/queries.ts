'use server'

import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

export async function getMyDashboardMetrics(userId: string) {
    const whereClause = { ownerId: userId, stage: { notIn: ['closed_won', 'closed_lost'] } };

    const myOppCounts = await prisma.opportunity.aggregate({
        where: whereClause,
        _count: {
            id: true,
        },
    });

    const thirtyDaysAgo = subDays(new Date(), 30);
    const myStaleCount = await prisma.opportunity.count({
        where: {
            ...whereClause,
            updatedAt: { 
                lt: thirtyDaysAgo 
            },
        },
    });

    const myMissingNextStepCount = await prisma.opportunity.count({
        where: {
            ...whereClause,
            nextStep: null,
        }
    });

    const myOverdueNextStepCount = await prisma.opportunity.count({
        where: {
            ...whereClause,
            nextStepDueDate: { 
                lt: new Date() 
            },
        }
    });
    
    const myOrgCount = await prisma.organization.count({
        where: { ownerId: userId },
    });

    return {
        myOppCount: myOppCounts._count.id,
        myStaleCount,
        myMissingNextStepCount,
        myOverdueNextStepCount,
        myOrgCount,
    };
}

// The global getDashboardMetrics function remains unchanged below
export async function getDashboardMetrics() {
    const orgCounts = await prisma.organization.groupBy({
        by: ['status'],
        _count: {
            id: true,
        },
    });

    const totalOrgs = orgCounts.reduce((acc, group) => acc + group._count.id, 0);
    const activeOrgs = orgCounts.find(g => g.status === 'active')?._count.id ?? 0;
    const inactiveOrgs = orgCounts.find(g => g.status === 'inactive')?._count.id ?? 0;

    const oppCounts = await prisma.opportunity.aggregate({
        _count: {
            id: true,
        },
    });

    const oppsByStage = await prisma.opportunity.groupBy({
        by: ['stage'],
        _count: {
            id: true,
        },
    });

    const oppsByOwner = await prisma.opportunity.groupBy({
        by: ['ownerId'],
        _count: {
            id: true,
        },
        orderBy: {
            _count: {
                id: 'desc',
            },
        },
    });

    const thirtyDaysAgo = subDays(new Date(), 30);
    const staleCount = await prisma.opportunity.count({
        where: {
            updatedAt: { 
                lt: thirtyDaysAgo 
            },
            stage: { 
                notIn: ['closed_won', 'closed_lost'] 
            },
        },
    });

    const missingNextStepCount = await prisma.opportunity.count({
        where: {
            nextStep: null,
            stage: { 
                notIn: ['closed_won', 'closed_lost'] 
            },
        }
    });

    const overdueNextStepCount = await prisma.opportunity.count({
        where: {
            nextStepDueDate: { 
                lt: new Date() 
            },
            stage: { 
                notIn: ['closed_won', 'closed_lost'] 
            },
        }
    });

    // Fetch owner names for the owner grouping
    const userIds = oppsByOwner.map(o => o.ownerId).filter(Boolean) as string[];
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
    });
    const userMap = new Map(users.map(u => [u.id, u.name]));

    const oppsByOwnerWithName = oppsByOwner.map(o => ({
        ownerName: o.ownerId ? userMap.get(o.ownerId) ?? 'Unassigned' : 'Unassigned',
        count: o._count.id,
    }));

    return {
        orgCounts: {
            total: totalOrgs,
            active: activeOrgs,
            inactive: inactiveOrgs,
        },
        oppCounts: {
            total: oppCounts._count.id,
        },
        oppsByStage: oppsByStage.map(g => ({ stage: g.stage, count: g._count.id })),
        oppsByOwner: oppsByOwnerWithName,
        staleCount,
        pendingActions: {
            missing: missingNextStepCount,
            overdue: overdueNextStepCount,
        }
    };
}
