// Canonical 12+1 stage type from @packages/auth STAGES (lowercase string values)
export type CanonicalStage = string;

export enum OpportunityStage {
  LEAD_ENGAGED = 'LEAD_ENGAGED',
  DISCOVERY = 'DISCOVERY',
  MOCKUP_STAGE = 'MOCKUP_STAGE',
  INVOICE_SENT = 'INVOICE_SENT',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',

  // Legacy aliases mapped for backward compatibility in database/existing queries.
  LEAD_ASSIGNED = 'LEAD_ASSIGNED',
  CONTACTED = 'CONTACTED',
  MOCKUP_REQUESTED = 'MOCKUP_REQUESTED',
  MOCKUP_DELIVERED = 'MOCKUP_DELIVERED',
  DECISION_PENDING = 'DECISION_PENDING',

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
  sport?: string;
  season?: string;
  year?: number;
  status: string;
  value: number;
  created_by: number;
  updated_by: number;
  created_at: Date;
  updated_at: Date;
  stage: string;
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
  from_stage: string;
  to_stage: string;
  changed_by: number;
  changed_at: Date;
  note?: string;
}

// ---------------------------------------------------------------------------
// Frontend-facing DTO — camelCase, stable API contract.
// ---------------------------------------------------------------------------

export interface OpportunityDto {
  id: number;
  name: string;
  organizationId: number;
  sport: string | null;
  season: string | null;
  year: number | null;
  status: string;
  value: number;
  createdBy: number;
  updatedBy: number;
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
  stage: string;
  channelType: OpportunityChannelType | null;
  dealType: string;
  nextAction: string | null;
  expectedCloseDate: string | null;
  lastActivityDate: string; // ISO-8601
  assignedRepId: number | null;
  assignedDirectorId: number | null;
  estimatedRevenue: number | null;
  actualRevenue: number | null;
  actualCost: number | null;
  grossProfit: number | null;
  closedAt: string | null;
  lossReason: string | null;
}

// ---------------------------------------------------------------------------
// Input types — validated shapes for create / update operations.
// ---------------------------------------------------------------------------

export interface CreateOpportunityInput {
  name: string;
  organizationId: number;
  channelType: OpportunityChannelType;
  /** Frontend sends string name; backend resolves to numeric ID. */
  assignedRep?: string;
  assignedDirector?: string;
  sport?: string;
  season?: string;
  year?: number;
  value?: number;
  estimatedValue?: number;
  stage?: string;
  nextAction?: string;
  expectedCloseDate?: string;
  createdBy?: number;
  updatedBy?: number;
}

export interface UpdateOpportunityInput {
  name?: string;
  organizationId?: number;
  assignedRep?: string;
  assignedDirector?: string;
  sport?: string;
  season?: string;
  year?: number;
  status?: string;
  value?: number;
  stage?: string;
  channelType?: OpportunityChannelType;
  nextAction?: string;
  expectedCloseDate?: string;
  estimatedRevenue?: number;
  actualRevenue?: number;
  actualCost?: number;
  lossReason?: string;
  updatedBy?: number;
  createdBy?: number;
}

export interface AdvanceStageInput {
  stage: string;
  changedBy: number;
  note?: string;
  actualRevenue?: number;
  actualCost?: number;
  lossReason?: string;
}

export interface OpportunityListParams {
  search?: string;
  stage?: string;
  lane?: string;
  rep?: string;
  sport?: string;
  limit?: number;
  offset?: number;
}
