import { OpportunityStage } from '@prisma/client'

const ALLOWED_STAGE_TRANSITIONS: Record<OpportunityStage, OpportunityStage[]> = {
  lead: ['contacted', 'closed_lost'],
  contacted: ['mockup', 'sample', 'invoice', 'closed_lost'],
  mockup: ['sample', 'invoice', 'closed_lost'],
  sample: ['invoice', 'closed_lost'],
  invoice: ['closed_won', 'closed_lost'],
  closed_won: [],
  closed_lost: [],
}

export function canTransitionOpportunityStage(from: OpportunityStage, to: OpportunityStage): boolean {
  if (from === to) return true
  return ALLOWED_STAGE_TRANSITIONS[from].includes(to)
}

export function getAllowedOpportunityStageTransitions(from: OpportunityStage): OpportunityStage[] {
  return ALLOWED_STAGE_TRANSITIONS[from]
}
