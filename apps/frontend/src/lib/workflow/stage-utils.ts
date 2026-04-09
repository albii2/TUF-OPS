import { OpportunityStage } from '@prisma/client'

export const OPPORTUNITY_STAGES: OpportunityStage[] = [
  'lead',
  'contacted',
  'mockup',
  'sample',
  'invoice',
  'closed_won',
  'closed_lost',
]

export const TERMINAL_OPPORTUNITY_STAGES: OpportunityStage[] = ['closed_won', 'closed_lost']

export const NON_ACTIONABLE_OPPORTUNITY_STAGES: OpportunityStage[] = TERMINAL_OPPORTUNITY_STAGES

export const OPPORTUNITY_STAGE_LABELS: Record<OpportunityStage, string> = {
  lead: 'Lead',
  contacted: 'Contacted',
  mockup: 'Mockup',
  sample: 'Sample',
  invoice: 'Invoice',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
}

export function isOpportunityStage(value: string | null | undefined): value is OpportunityStage {
  return !!value && value in OPPORTUNITY_STAGE_LABELS
}

export function getOpportunityStageLabel(stage?: string | null): string {
  if (isOpportunityStage(stage)) return OPPORTUNITY_STAGE_LABELS[stage]
  return 'Unstaged'
}

export function isTerminalOpportunityStage(stage: OpportunityStage): boolean {
  return TERMINAL_OPPORTUNITY_STAGES.includes(stage)
}
