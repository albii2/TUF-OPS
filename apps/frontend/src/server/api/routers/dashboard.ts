import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { db } from "@/server/db";
import { startOfMonth, endOfMonth, startOfToday } from 'date-fns';
import { OpportunityStage } from '@prisma/client';

export const dashboardRouter = createTRPCRouter({
  getDashboardData: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.session.user;
    const userId = Number(user.id);
    const userRole = user.role.toLowerCase();

    const now = new Date();
    const startOfThisMonth = startOfMonth(now);
    const endOfThisMonth = endOfMonth(now);
    const today = startOfToday();

    let opportunityWhereClause: any = {};
    if (userRole === 'rep') {
        opportunityWhereClause = { ownerId: userId };
    }

    const openOpportunitiesCount = await db.opportunity.count({
        where: {
            ...opportunityWhereClause,
            stage: { notIn: ['closed_won', 'closed_lost'] },
        },
    });

    const revenueThisMonth = await db.order.aggregate({
        _sum: { total: true },
        where: {
            createdAt: { gte: startOfThisMonth, lte: endOfThisMonth },
        },
    });

    const overdueActions = await db.opportunity.findMany({
        where: { ...opportunityWhereClause, nextStepDueDate: { lt: today }, stage: { notIn: ['closed_won', 'closed_lost'] } },
        select: { id: true, name: true, nextStep: true, nextStepDueDate: true, program: { select: { name: true } } },
        orderBy: { nextStepDueDate: 'asc' },
    });

    const upcomingActions = await db.opportunity.findMany({
        where: { ...opportunityWhereClause, nextStep: { not: null }, nextStepDueDate: { gte: today }, stage: { notIn: ['closed_won', 'closed_lost'] } },
        select: { id: true, name: true, nextStep: true, nextStepDueDate: true, program: { select: { name: true } } },
        orderBy: { nextStepDueDate: 'asc' },
        take: 5,
    });

    const pipelineSnapshot = await db.opportunity.groupBy({
        by: ['stage'],
        _count: { stage: true },
        _sum: { estimatedValue: true },
        where: {
            ...opportunityWhereClause,
            stage: { notIn: ['closed_won', 'closed_lost'] },
        },
    });

    const nearCloseOpportunities = await db.opportunity.findMany({
        where: {
            ...opportunityWhereClause,
            stage: 'invoice',
        },
        select: { id: true, name: true, estimatedValue: true, program: { select: { name: true } } },
        orderBy: { estimatedValue: 'desc' },
        take: 5,
    });

    return {
        openOpportunitiesCount,
        revenueThisMonth: revenueThisMonth._sum.total ?? 0,
        overdueActions,
        upcomingActions,
        pipelineSnapshot: pipelineSnapshot.map(p => ({ ...p, _sum: { estimated_value: p._sum.estimatedValue }, stage: p.stage as OpportunityStage })),
        nearCloseOpportunities: nearCloseOpportunities.map(o => ({ ...o, estimated_value: o.estimatedValue })),
    };
  }),
});
