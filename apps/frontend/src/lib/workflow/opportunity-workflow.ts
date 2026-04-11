import {
  NON_ACTIONABLE_OPPORTUNITY_STAGES,
  getOpportunityStageLabel,
  isOpportunityStage,
} from './stage-utils'

type WorkflowOpportunityLike = {
  stage?: string | null
  nextStep?: string | null
  nextStepDueDate?: Date | string | null
  updatedAt?: Date | string | null
}

export { isOpportunityStage, getOpportunityStageLabel }

export function isTerminalOpportunityStage(stage?: string | null): boolean {
  return stage === 'closed_won' || stage === 'closed_lost'
}

export function isNonActionableOpportunityStage(stage?: string | null): boolean {
  return !!stage && isOpportunityStage(stage) && NON_ACTIONABLE_OPPORTUNITY_STAGES.includes(stage)
}

export function hasNextStep(opportunity: WorkflowOpportunityLike): boolean {
  return !!opportunity.nextStep?.trim()
}

export function isNextStepOverdue(opportunity: WorkflowOpportunityLike, now = new Date()): boolean {
  if (!opportunity.nextStepDueDate) return false
  const due = new Date(opportunity.nextStepDueDate)
  return due.getTime() < now.getTime()
}

export function getOpportunityStaleThresholdDays(stage?: string | null): number | null {
  switch (stage) {
    case 'invoice':
      return 3
    case 'mockup':
    case 'sample':
      return 5
    case 'lead':
    case 'contacted':
      return 7
    case 'closed_won':
    case 'closed_lost':
      return null
    default:
      return 7
  }
}

export function isOpportunityStale(opportunity: WorkflowOpportunityLike, now = new Date()): boolean {
  const thresholdDays = getOpportunityStaleThresholdDays(opportunity.stage)
  if (thresholdDays == null || !opportunity.updatedAt) return false

  const updated = new Date(opportunity.updatedAt)
  const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000

  return now.getTime() - updated.getTime() > thresholdMs
}

export function needsOpportunityAction(opportunity: WorkflowOpportunityLike, now = new Date()): boolean {
  if (isNonActionableOpportunityStage(opportunity.stage)) return false
  if (!hasNextStep(opportunity)) return true
  if (isNextStepOverdue(opportunity, now)) return true
  if (isOpportunityStale(opportunity, now)) return true
  return false
}

export function getOpportunityHealthState(
  opportunity: WorkflowOpportunityLike,
  now = new Date(),
): 'healthy' | 'warning' | 'urgent' | 'inactive' {
  if (isTerminalOpportunityStage(opportunity.stage)) return 'inactive'
  if (isNextStepOverdue(opportunity, now)) return 'urgent'
  if (needsOpportunityAction(opportunity, now)) return 'warning'
  return 'healthy'
}
