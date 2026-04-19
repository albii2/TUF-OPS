export enum OpportunityStage {
  LEAD_ASSIGNED = 'LEAD_ASSIGNED',
  CONTACT_INITIATED = 'CONTACT_INITIATED',
  MOCKUP_IN_PROGRESS = 'MOCKUP_IN_PROGRESS',
  MOCKUP_APPROVED = 'MOCKUP_APPROVED',
  SAMPLE_REQUESTED = 'SAMPLE_REQUESTED',
  SAMPLE_IN_PRODUCTION = 'SAMPLE_IN_PRODUCTION',
  SAMPLE_APPROVED = 'SAMPLE_APPROVED',
  INVOICE_SENT = 'INVOICE_SENT',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
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
