import { Opportunity } from '@prisma/client'
import {
  FocusMetric,
  NextAction,
  PipelineStageSummary,
  RevenueSummary,
  DealNearClose,
  RecentActivity,
} from '@/types/dashboard'
import { needsOpportunityAction, isNextStepOverdue } from '@/lib/workflow/opportunity-workflow'
import type { AppSessionUser } from '@/types/auth'

function getSessionUserId(user: AppSessionUser | null) {
  if (!user?.id) return null
  const parsed = Number(user.id)
  return Number.isNaN(parsed) ? null : parsed
}

export function selectFocusMetrics(opportunities: Opportunity[], user: AppSessionUser | null): FocusMetric[] {
  const userId = getSessionUserId(user)
  const myOpps = opportunities.filter((opp) => opp.ownerId === userId)
  const dealsNeedAction = myOpps.filter((opp) => needsOpportunityAction(opp)).length
  const nearClose = myOpps.filter((opp) => ['invoice', 'closed_won'].includes(opp.stage)).length

  return [
    { label: 'My Deals Need Action', value: dealsNeedAction },
    { label: 'My Deals Near Close', value: nearClose },
  ]
}

export function selectNextActions(
  opportunities: (Opportunity & { organization: { name: string } | null })[],
  user: AppSessionUser | null
): NextAction[] {
  const userId = getSessionUserId(user)
  const myOpps = opportunities.filter((opp) => opp.ownerId === userId)

  return myOpps
    .filter((opp) =>
      needsOpportunityAction({
        stage: opp.stage,
        nextStep: opp.nextStep,
        nextStepDueDate: opp.nextStepDueDate,
        updatedAt: opp.updated_at,
      })
    )
    .sort((a, b) => {
      const aIsOverdue = isNextStepOverdue(a)
      const bIsOverdue = isNextStepOverdue(b)
      if (aIsOverdue && !bIsOverdue) return -1
      if (!aIsOverdue && bIsOverdue) return 1
      return (b.estimated_value ? Number(b.estimated_value) : 0) - (a.estimated_value ? Number(a.estimated_value) : 0)
    })
    .map((opp) => ({
      id: opp.id.toString(),
      opportunityName: opp.name,
      organizationName: opp.organization?.name || '-',
      description: opp.nextStep || 'Define next step',
      dueDate: opp.nextStepDueDate || new Date(),
      value: opp.estimated_value ? Number(opp.estimated_value) : 0,
    }))
}

export function selectPipelineSnapshot(_opportunities: Opportunity[], _user: AppSessionUser | null): PipelineStageSummary[] {
  return [
    { stage: 'Contacted', count: 42, totalValue: 42000 },
    { stage: 'Mockup', count: 33, totalValue: 331000 },
    { stage: 'Invoice', count: 22, totalValue: 222000 },
    { stage: 'Closed', count: 11, totalValue: 115000 },
  ]
}

export function selectRevenueSummary(_opportunities: Opportunity[], _user: AppSessionUser | null): RevenueSummary {
  return {
    total: 38400,
    pending: 21200,
    overdue: 6800,
  }
}

export function selectDealsNearClose(
  opportunities: (Opportunity & { organization: { name: string } | null })[],
  user: AppSessionUser | null
): DealNearClose[] {
  const userId = getSessionUserId(user)
  const myOpps = opportunities.filter((opp) => opp.ownerId === userId)

  return myOpps
    .filter((opp) => ['invoice', 'closed_won'].includes(opp.stage))
    .map((opp) => ({
      id: opp.id.toString(),
      opportunityName: opp.name,
      organizationName: opp.organization?.name || '-',
      value: opp.estimated_value ? Number(opp.estimated_value) : 0,
      closingDate: opp.close_date || new Date(),
    }))
}

export function selectRecentActivity(_opportunities: Opportunity[], _user: AppSessionUser | null): RecentActivity[] {
  return [
    { id: '1', type: 'deal', description: 'Pipeline updated', timestamp: new Date(), link: '/opportunities/1' },
    { id: '2', type: 'deal', description: 'Owner updated', timestamp: new Date(), link: '/opportunities/1' },
    { id: '3', type: 'deal', description: 'Next step added', timestamp: new Date(), link: '/opportunities/1' },
  ]
}
