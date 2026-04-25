export enum OpportunityStage {
  LEAD_ASSIGNED = 'LEAD_ASSIGNED',
  CONTACTED = 'CONTACTED',
  DISCOVERY = 'DISCOVERY',
  MOCKUP_REQUESTED = 'MOCKUP_REQUESTED',
  MOCKUP_DELIVERED = 'MOCKUP_DELIVERED',
  INVOICE_SENT = 'INVOICE_SENT',
  DECISION_PENDING = 'DECISION_PENDING',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',

  // Legacy aliases retained for backward compatibility in tests/older callers.
  NOT_STARTED = 'LEAD_ASSIGNED',
  CONTACT_INITIATED = 'CONTACTED',
  MOCKUP_IN_PROGRESS = 'MOCKUP_REQUESTED',
  MOCKUP_APPROVED = 'MOCKUP_DELIVERED',
  SAMPLE_REQUESTED = 'INVOICE_SENT',
  SAMPLE_IN_PRODUCTION = 'DECISION_PENDING',
  SAMPLE_APPROVED = 'DECISION_PENDING',
  PAYMENT_RECEIVED = 'DECISION_PENDING',
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
