'use server'

import { prisma } from "@/lib/prisma";
import type { OpportunityStage } from "@prisma/client";
import { subDays } from "date-fns";

const CLOSED_STAGES: OpportunityStage[] = ["closed_won", "closed_lost"];

function isDatabaseUnavailableError(error: unknown): boolean {
    if (!error || typeof error !== "object") {
        return false;
    }

    const maybeCode = "code" in error ? (error as { code?: unknown }).code : undefined;
    const maybeMessage = "message" in error ? (error as { message?: unknown }).message : undefined;

    if (maybeCode === "P1003") {
        return true;
    }

    if (typeof maybeMessage === "string") {
        return maybeMessage.includes("Database") && maybeMessage.includes("does not exist");
    }

    return false;
}

export async function getMyDashboardMetrics(userId: string) {
    try {
        const parsedUserId = parseInt(userId, 10);
        const whereClause = { ownerId: parsedUserId, stage: { notIn: CLOSED_STAGES } };

        const myOppCount = await prisma.opportunity.count({ where: whereClause });

        const thirtyDaysAgo = subDays(new Date(), 30);
        const myStaleCount = await prisma.opportunity.count({
            where: {
                ...whereClause,
                updated_at: {
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
            where: { ownerId: parsedUserId },
        });

        return {
            myOppCount,
            myStaleCount,
            myMissingNextStepCount,
            myOverdueNextStepCount,
            myOrgCount,
        };
    } catch (error) {
        if (!isDatabaseUnavailableError(error)) {
            throw error;
        }

        return {
            myOppCount: 0,
            myStaleCount: 0,
            myMissingNextStepCount: 0,
            myOverdueNextStepCount: 0,
            myOrgCount: 0,
        };
    }
}

// The global getDashboardMetrics function remains unchanged below
export async function getDashboardMetrics() {
    try {
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
                updated_at: {
                    lt: thirtyDaysAgo
                },
                stage: {
                    notIn: CLOSED_STAGES
                },
            },
        });

        const missingNextStepCount = await prisma.opportunity.count({
            where: {
                nextStep: null,
                stage: {
                    notIn: CLOSED_STAGES
                },
            }
        });

        const overdueNextStepCount = await prisma.opportunity.count({
            where: {
                nextStepDueDate: {
                    lt: new Date()
                },
                stage: {
                    notIn: CLOSED_STAGES
                },
            }
        });

        // Fetch owner names for the owner grouping
        const userIds = oppsByOwner.map(o => o.ownerId).filter(Boolean) as number[];
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
    } catch (error) {
        if (!isDatabaseUnavailableError(error)) {
            throw error;
        }

        return {
            orgCounts: {
                total: 0,
                active: 0,
                inactive: 0,
            },
            oppCounts: {
                total: 0,
            },
            oppsByStage: [],
            oppsByOwner: [],
            staleCount: 0,
            pendingActions: {
                missing: 0,
                overdue: 0,
            }
        };
    }
}
