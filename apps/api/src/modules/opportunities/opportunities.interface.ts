export enum OpportunityStage {
  LEAD_ENGAGED = 'LEAD_ENGAGED',
  DISCOVERY = 'DISCOVERY',
  MOCKUP_STAGE = 'MOCKUP_STAGE',
  INVOICE_SENT = 'INVOICE_SENT',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',

  // Legacy aliases mapped for backward compatibility in database/existing queries.
  LEAD_ASSIGNED = 'LEAD_ENGAGED',
  CONTACTED = 'LEAD_ENGAGED',
  MOCKUP_REQUESTED = 'MOCKUP_STAGE',
  MOCKUP_DELIVERED = 'MOCKUP_STAGE',
  DECISION_PENDING = 'INVOICE_SENT',

  // Legacy aliases retained for backward compatibility in tests/older callers.
  NOT_STARTED = 'LEAD_ENGAGED',
  CONTACT_INITIATED = 'LEAD_ENGAGED',
  MOCKUP_IN_PROGRESS = 'MOCKUP_STAGE',
  MOCKUP_APPROVED = 'MOCKUP_STAGE',
  SAMPLE_REQUESTED = 'INVOICE_SENT',
  SAMPLE_IN_PRODUCTION = 'INVOICE_SENT',
  SAMPLE_APPROVED = 'INVOICE_SENT',
  PAYMENT_RECEIVED = 'INVOICE_SENT',
}

export enum OpportunityChannelType {
  UNIFORM = 'UNIFORM',
  TRAVEL_GEAR = 'TRAVEL_GEAR',
  TEAM_STORE = 'TEAM_STORE',
  LETTERMAN = 'LETTERMAN',
}

export interface Opportunity {
  id: number;
  name: string;
  organization_id: number;
  sport?: string;
  season?: string;
  year?: number;
  status: string;
  value: number;
  created_by: number;
  updated_by: number;
  created_at: Date;
  updated_at: Date;
  stage: OpportunityStage;
  channel_type: OpportunityChannelType | null;
  next_action?: string;
  expected_close_date?: Date;
  last_activity_date: Date;
  assigned_rep_id?: number;
  assigned_director_id?: number;
  estimated_revenue?: number;
  actual_revenue?: number;
  actual_cost?: number;
  gross_profit?: number;
  closed_at?: Date;
  loss_reason?: string;
  deal_type: string;
}

export interface OpportunityStageHistory {
  id: number;
  opportunity_id: number;
  from_stage: OpportunityStage;
  to_stage: OpportunityStage;
  changed_by: number;
  changed_at: Date;
  note?: string;
}
