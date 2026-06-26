export const STAGES = {
  LEAD: 'lead',
  CONTACTED: 'contacted',
  PROPOSAL_SENT: 'proposal_sent',
  NEGOTIATION: 'negotiation',
  ORDER_ASSEMBLY: 'order_assembly',
  DIRECTOR_QA: 'director_qa',
  CLOSED_WON: 'closed_won',
  READY_FOR_OPS: 'ready_for_operations',
  IN_PRODUCTION: 'in_production',
  QUALITY_CONTROL: 'quality_control',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  // Additional terminal stage — not part of the 12-stage pipeline but valid
  CLOSED_LOST: 'closed_lost',
} as const;

export type Stage = typeof STAGES[keyof typeof STAGES];

// Valid transitions per SOS 6.3. CLOSED_LOST is reachable from any sales stage.
export const VALID_TRANSITIONS: Record<Stage, Stage[]> = {
  [STAGES.LEAD]: [STAGES.CONTACTED, STAGES.CLOSED_LOST],
  [STAGES.CONTACTED]: [STAGES.PROPOSAL_SENT, STAGES.CLOSED_LOST],
  [STAGES.PROPOSAL_SENT]: [STAGES.NEGOTIATION, STAGES.CLOSED_LOST],
  [STAGES.NEGOTIATION]: [STAGES.ORDER_ASSEMBLY, STAGES.CLOSED_LOST],
  [STAGES.ORDER_ASSEMBLY]: [STAGES.DIRECTOR_QA, STAGES.CLOSED_LOST],
  [STAGES.DIRECTOR_QA]: [STAGES.CLOSED_WON, STAGES.CLOSED_LOST],
  [STAGES.CLOSED_WON]: [STAGES.READY_FOR_OPS],
  [STAGES.READY_FOR_OPS]: [STAGES.IN_PRODUCTION],
  [STAGES.IN_PRODUCTION]: [STAGES.QUALITY_CONTROL],
  [STAGES.QUALITY_CONTROL]: [STAGES.SHIPPED],
  [STAGES.SHIPPED]: [STAGES.DELIVERED],
  [STAGES.DELIVERED]: [], // terminal
  [STAGES.CLOSED_LOST]: [], // terminal
};

// Sales stages (TAE domain — pre-Closed Won)
export const SALES_STAGES: Stage[] = [
  STAGES.LEAD, STAGES.CONTACTED, STAGES.PROPOSAL_SENT,
  STAGES.NEGOTIATION, STAGES.ORDER_ASSEMBLY, STAGES.DIRECTOR_QA,
];

// Fulfillment stages (Operations domain — post-Closed Won)
export const FULFILLMENT_STAGES: Stage[] = [
  STAGES.READY_FOR_OPS, STAGES.IN_PRODUCTION,
  STAGES.QUALITY_CONTROL, STAGES.SHIPPED, STAGES.DELIVERED,
];

export function isValidTransition(from: Stage, to: Stage): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isSalesStage(stage: Stage): boolean {
  return SALES_STAGES.includes(stage);
}

export function isFulfillmentStage(stage: Stage): boolean {
  return FULFILLMENT_STAGES.includes(stage);
}

/** Normalize any stage string to lowercase for comparison (handles legacy uppercase values). */
export function normalizeStage(stage: string): string {
  return stage?.toLowerCase() ?? '';
}
