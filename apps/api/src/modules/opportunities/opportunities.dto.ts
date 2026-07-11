import type {
  Opportunity,
  OpportunityDto,
  OpportunityChannelType,
  CreateOpportunityInput,
  UpdateOpportunityInput,
  CanonicalStage,
} from './opportunities.interface';

// ---------------------------------------------------------------------------
// Pure transform: DB row → API response DTO (snake_case → camelCase).
// ---------------------------------------------------------------------------

export function toOpportunityDto(row: Opportunity): OpportunityDto {
  return {
    id: row.id,
    name: row.name,
    organizationId: row.organization_id,
    sport: row.sport ?? null,
    season: row.season ?? null,
    year: row.year ?? null,
    status: row.status,
    value: Number(row.value),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: toISO(row.created_at),
    updatedAt: toISO(row.updated_at),
    stage: row.stage,
    channelType: row.channel_type ?? null,
    dealType: row.deal_type,
    nextAction: row.next_action ?? null,
    expectedCloseDate: toISOOrNull(row.expected_close_date),
    lastActivityDate: toISO(row.last_activity_date),
    assignedRepId: row.assigned_rep_id ?? null,
    assignedDirectorId: row.assigned_director_id ?? null,
    estimatedRevenue: row.estimated_revenue ? Number(row.estimated_revenue) : null,
    actualRevenue: row.actual_revenue ? Number(row.actual_revenue) : null,
    actualCost: row.actual_cost ? Number(row.actual_cost) : null,
    grossProfit: row.gross_profit ? Number(row.gross_profit) : null,
    closedAt: toISOOrNull(row.closed_at),
    lossReason: row.loss_reason ?? null,
  };
}

/** Batch transform for list endpoints. */
export function toOpportunityDtos(rows: Opportunity[]): OpportunityDto[] {
  return rows.map(toOpportunityDto);
}

// ---------------------------------------------------------------------------
// Normalize input: resolve frontend shapes → DB-ready snake_case params.
// ---------------------------------------------------------------------------

export interface ResolvedOpportunityCreateParams {
  name: string;
  organization_id: number;
  sport: string;
  season: string;
  year: number;
  status: string;
  value: number;
  stage: string;
  channel_type: OpportunityChannelType;
  deal_type: string;
  created_by: number;
  updated_by: number;
  assigned_rep_id: number | null;
  assigned_director_id: number | null;
  next_action?: string | null;
  expected_close_date?: Date | string | null;
  estimated_revenue?: number | null;
}

export interface ResolvedOpportunityUpdateParams {
  name?: string;
  organization_id?: number;
  sport?: string;
  season?: string;
  year?: number;
  status?: string;
  value?: number;
  stage?: string;
  channel_type?: OpportunityChannelType;
  deal_type?: string;
  updated_by?: number;
  created_by?: number;
  assigned_rep_id?: number | null;
  assigned_director_id?: number | null;
  next_action?: string | null;
  expected_close_date?: Date | string | null;
  estimated_revenue?: number | null;
  actual_revenue?: number | null;
  actual_cost?: number | null;
  loss_reason?: string | null;
}

/**
 * Prepare a create input for the DB layer.
 *
 * Callers should resolve name → ID before calling this:
 *   resolveUserId(input.assignedRep) → assigned_rep_id
 */
export function normalizeCreateOpportunityInput(
  input: CreateOpportunityInput,
  resolvedRepId: number | null,
  resolvedDirectorId: number | null,
): ResolvedOpportunityCreateParams {
  const channelType = input.channelType;
  return {
    name: input.name.trim(),
    organization_id: input.organizationId,
    sport: input.sport ?? 'FOOTBALL',
    season: input.season ?? 'FALL',
    year: input.year ?? 2026,
    status: 'open',
    value: input.value ?? input.estimatedValue ?? 0,
    stage: input.stage ?? 'lead',
    channel_type: channelType,
    deal_type: channelType,
    created_by: input.createdBy ?? resolvedRepId ?? 1,
    updated_by: input.updatedBy ?? resolvedRepId ?? 1,
    assigned_rep_id: resolvedRepId,
    assigned_director_id: resolvedDirectorId,
    next_action: input.nextAction ?? null,
    expected_close_date: input.expectedCloseDate ?? null,
    estimated_revenue: input.estimatedValue ?? null,
  };
}

/**
 * Prepare an update input for the DB layer.
 */
export function normalizeUpdateOpportunityInput(
  input: UpdateOpportunityInput,
  resolvedRepId: number | null,
  resolvedDirectorId: number | null,
): ResolvedOpportunityUpdateParams {
  const params: ResolvedOpportunityUpdateParams = {};

  if (input.name !== undefined) params.name = input.name.trim();
  if (input.organizationId !== undefined) params.organization_id = input.organizationId;
  if (input.sport !== undefined) params.sport = input.sport;
  if (input.season !== undefined) params.season = input.season;
  if (input.year !== undefined) params.year = input.year;
  if (input.status !== undefined) params.status = input.status;
  if (input.value !== undefined) params.value = input.value;
  if (input.stage !== undefined) params.stage = input.stage;
  if (input.channelType !== undefined) {
    params.channel_type = input.channelType;
    params.deal_type = input.channelType;
  }
  if (input.nextAction !== undefined) params.next_action = input.nextAction;
  if (input.expectedCloseDate !== undefined) params.expected_close_date = input.expectedCloseDate;
  if (input.estimatedRevenue !== undefined) params.estimated_revenue = input.estimatedRevenue;
  if (input.actualRevenue !== undefined) params.actual_revenue = input.actualRevenue;
  if (input.actualCost !== undefined) params.actual_cost = input.actualCost;
  if (input.lossReason !== undefined) params.loss_reason = input.lossReason;
  if (input.updatedBy !== undefined) params.updated_by = input.updatedBy;
  if (input.createdBy !== undefined) params.created_by = input.createdBy;
  if (resolvedRepId !== undefined) params.assigned_rep_id = resolvedRepId;
  if (resolvedDirectorId !== undefined) params.assigned_director_id = resolvedDirectorId;

  return params;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toISO(d: Date | string | undefined | null): string {
  if (d instanceof Date) return d.toISOString();
  if (typeof d === 'string') return d;
  return new Date().toISOString();
}

function toISOOrNull(d: Date | string | undefined | null): string | null {
  if (d instanceof Date) return d.toISOString();
  if (typeof d === 'string') return d;
  return null;
}
