'use server'

import { OpportunityStage } from '@prisma/client'
import { subDays } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { withDatabaseFallback } from '@/lib/runtime/database-health'

const CLOSED_STAGES: OpportunityStage[] = ['closed_won', 'closed_lost']
const ACTIVE_STAGE_WHERE = { notIn: CLOSED_STAGES }

type MyDashboardMetrics = {
  myOppCount: number
  myStaleCount: number
  myMissingNextStepCount: number
  myOverdueNextStepCount: number
  myOrgCount: number
}

type DashboardMetrics = {
  orgCounts: {
    total: number
    active: number
    inactive: number
  }
  oppCounts: {
    total: number
  }
  oppsByStage: Array<{
    stage: OpportunityStage
    count: number
  }>
  oppsByOwner: Array<{
    ownerName: string
    count: number
  }>
  staleCount: number
  pendingActions: {
    missing: number
    overdue: number
  }
}

const EMPTY_MY_DASHBOARD_METRICS: MyDashboardMetrics = {
  myOppCount: 0,
  myStaleCount: 0,
  myMissingNextStepCount: 0,
  myOverdueNextStepCount: 0,
  myOrgCount: 0,
}

const EMPTY_DASHBOARD_METRICS: DashboardMetrics = {
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
}

export async function getMyDashboardMetrics(userId: string): Promise<MyDashboardMetrics> {
  return withDatabaseFallback(
    'getMyDashboardMetrics',
    async () => {
      const parsedUserId = parseInt(userId, 10)
      const whereClause = {
        ownerId: parsedUserId,
        stage: ACTIVE_STAGE_WHERE,
      }

      const myOppCounts = await prisma.opportunity.aggregate({
        where: whereClause,
        _count: { id: true },
      })

      const thirtyDaysAgo = subDays(new Date(), 30)
      const myStaleCount = await prisma.opportunity.count({
        where: {
          ...whereClause,
          updated_at: { lt: thirtyDaysAgo },
        },
      })

      const myMissingNextStepCount = await prisma.opportunity.count({
        where: {
          ...whereClause,
          nextStep: null,
        },
      })

      const myOverdueNextStepCount = await prisma.opportunity.count({
        where: {
          ...whereClause,
          nextStepDueDate: { lt: new Date(), not: null },
        },
      })

      const myOrgCount = await prisma.organization.count({
        where: { ownerId: parsedUserId },
      })

      return {
        myOppCount: myOppCounts._count.id ?? 0,
        myStaleCount,
        myMissingNextStepCount,
        myOverdueNextStepCount,
        myOrgCount,
      }
    },
    EMPTY_MY_DASHBOARD_METRICS,
  )
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  return withDatabaseFallback(
    'getDashboardMetrics',
    async () => {
      const orgCounts = await prisma.organization.groupBy({
        by: ['status'],
        _count: { id: true },
      })

      const totalOrgs = orgCounts.reduce((acc, group) => acc + group._count.id, 0)
      const activeOrgs = orgCounts.find((g) => g.status === 'active')?._count.id ?? 0
      const inactiveOrgs = orgCounts.find((g) => g.status === 'inactive')?._count.id ?? 0

      const oppCounts = await prisma.opportunity.aggregate({ _count: { id: true } })

      const oppsByStage = await prisma.opportunity.groupBy({
        by: ['stage'],
        _count: { id: true },
      })

      const oppsByOwner = await prisma.opportunity.groupBy({
        by: ['ownerId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      })

      const thirtyDaysAgo = subDays(new Date(), 30)
      const staleCount = await prisma.opportunity.count({
        where: {
          updated_at: { lt: thirtyDaysAgo },
          stage: ACTIVE_STAGE_WHERE,
        },
      })

      const missingNextStepCount = await prisma.opportunity.count({
        where: {
          nextStep: null,
          stage: ACTIVE_STAGE_WHERE,
        },
      })

      const overdueNextStepCount = await prisma.opportunity.count({
        where: {
          nextStepDueDate: { lt: new Date(), not: null },
          stage: ACTIVE_STAGE_WHERE,
        },
      })

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
    EMPTY_DASHBOARD_METRICS,
  )
}
