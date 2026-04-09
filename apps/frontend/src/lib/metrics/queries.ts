'use server'

import { prisma } from '@/lib/prisma'
import { subDays } from 'date-fns'
import { OpportunityStage } from '@prisma/client'
import { withDatabaseFallback } from '@/lib/runtime/database-health'

const CLOSED_STAGES: OpportunityStage[] = ['closed_won', 'closed_lost']

// Cache the current date to avoid multiple Date instantiations
function getNow() {
  return new Date()
}

function getThirtyDaysAgo(now: Date = getNow()) {
  return subDays(now, 30)
}

export async function getMyDashboardMetrics(userId: string) {
  return withDatabaseFallback(
    'getMyDashboardMetrics',
    async () => {
      const parsedUserId = parseInt(userId, 10)
      if (isNaN(parsedUserId)) {
        throw new Error('Invalid userId provided')
      }

      const now = getNow()
      const thirtyDaysAgo = getThirtyDaysAgo(now)

      const whereClause = {
        ownerId: parsedUserId,
        stage: { notIn: CLOSED_STAGES },
      }

      // Combine multiple queries using Promise.all for better performance
      const [myOppCounts, myStaleCount, myMissingNextStepCount, myOverdueNextStepCount, myOrgCount] = await Promise.all([
        prisma.opportunity.aggregate({
          where: whereClause,
          _count: { id: true },
        }),
        prisma.opportunity.count({
          where: {
            ...whereClause,
            updated_at: { lt: thirtyDaysAgo },
          },
        }),
        prisma.opportunity.count({
          where: {
            ...whereClause,
            nextStep: null,
          },
        }),
        prisma.opportunity.count({
          where: {
            ...whereClause,
            nextStepDueDate: { lt: now },
          },
        }),
        prisma.organization.count({
          where: { ownerId: parsedUserId },
        }),
      ])

      return {
        myOppCount: myOppCounts._count.id ?? 0,
        myStaleCount,
        myMissingNextStepCount,
        myOverdueNextStepCount,
        myOrgCount,
      }
    },
    {
      myOppCount: 0,
      myStaleCount: 0,
      myMissingNextStepCount: 0,
      myOverdueNextStepCount: 0,
      myOrgCount: 0,
    },
  )
}

export async function getDashboardMetrics() {
  return withDatabaseFallback(
    'getDashboardMetrics',
    async () => {
      const now = getNow()
      const thirtyDaysAgo = getThirtyDaysAgo(now)

      // Run queries in parallel
      const [orgCounts, oppCounts, oppsByStage, oppsByOwner, staleCount, missingNextStepCount, overdueNextStepCount] = await Promise.all([
        prisma.organization.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
        prisma.opportunity.aggregate({ _count: { id: true } }),
        prisma.opportunity.groupBy({ by: ['stage'], _count: { id: true } }),
        prisma.opportunity.groupBy({
          by: ['ownerId'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),
        prisma.opportunity.count({
          where: {
            updated_at: { lt: thirtyDaysAgo },
            stage: { notIn: CLOSED_STAGES },
          },
        }),
        prisma.opportunity.count({
          where: {
            nextStep: null,
            stage: { notIn: CLOSED_STAGES },
          },
        }),
        prisma.opportunity.count({
          where: {
            nextStepDueDate: { lt: now },
            stage: { notIn: CLOSED_STAGES },
          },
        }),
      ])

      const totalOrgs = orgCounts.reduce((acc, group) => acc + group._count.id, 0)
      const activeOrgs = orgCounts.find((g) => g.status === 'active')?._count.id ?? 0
      const inactiveOrgs = orgCounts.find((g) => g.status === 'inactive')?._count.id ?? 0

      // Fetch user data with a single query
      const userIds = oppsByOwner.map((o) => o.ownerId).filter(Boolean) as number[]
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      })
      const userMap = new Map(users.map((u) => [u.id, u.name]))

      const oppsByOwnerWithName = oppsByOwner.map((o) => ({
        ownerName: o.ownerId ? userMap.get(o.ownerId) ?? 'Unassigned' : 'Unassigned',
        count: o._count.id,
      }))

      return {
        orgCounts: {
          total: totalOrgs,
          active: activeOrgs,
          inactive: inactiveOrgs,
        },
        oppCounts: { total: oppCounts._count.id ?? 0 },
        oppsByStage: oppsByStage.map((g) => ({ stage: g.stage, count: g._count.id })),
        oppsByOwner: oppsByOwnerWithName,
        staleCount,
        pendingActions: {
          missing: missingNextStepCount,
          overdue: overdueNextStepCount,
        },
      }
    },
    {
      orgCounts: {
        total: 0,
        active: 0,
        inactive: 0,
      },
      oppCounts: { total: 0 },
      oppsByStage: [],
      oppsByOwner: [],
      staleCount: 0,
      pendingActions: {
        missing: 0,
        overdue: 0,
      },
    },
  )
}
