export const OPPORTUNITY_STAGES = [
  "lead_identified",
  "contacting",
  "discovery",
  "mockup_requested",
  "mockup_sent",
  "sample_required",
  "sample_sent",
  "awaiting_approval",
  "invoice_ready",
  "invoice_sent",
  "payment_pending",
  "won",
  "closed_lost",
  "inactive",
] as const;

export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

export const TERMINAL_OPPORTUNITY_STAGES: OpportunityStage[] = [
  "won",
  "closed_lost",
];

export const NON_ACTIONABLE_OPPORTUNITY_STAGES: OpportunityStage[] = [
  "won",
  "closed_lost",
  "inactive",
];

export const OPPORTUNITY_STAGE_LABELS: Record<OpportunityStage, string> = {
  lead_identified: "Lead Identified",
  contacting: "Contacting",
  discovery: "Discovery",
  mockup_requested: "Mockup Requested",
  mockup_sent: "Mockup Sent",
  sample_required: "Sample Required",
  sample_sent: "Sample Sent",
  awaiting_approval: "Awaiting Approval",
  invoice_ready: "Invoice Ready",
  invoice_sent: "Invoice Sent",
  payment_pending: "Payment Pending",
  won: "Won",
  closed_lost: "Closed Lost",
  inactive: "Inactive",
};
