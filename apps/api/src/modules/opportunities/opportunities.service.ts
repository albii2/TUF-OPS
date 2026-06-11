import { pool } from '@packages/database';
import { Opportunity, OpportunityStage, OpportunityStageHistory, OpportunityChannelType } from './opportunities.interface';
import { createCommission } from '../commissions/commissions.service';

const REQUIRED_CHANNELS: OpportunityChannelType[] = [
  OpportunityChannelType.UNIFORM,
  OpportunityChannelType.TRAVEL_GEAR,
  OpportunityChannelType.TEAM_STORE,
  OpportunityChannelType.LETTERMAN,
];
const DEFAULT_SPORT = 'FOOTBALL';
const DEFAULT_SEASON = 'FALL';
const DEFAULT_YEAR = 2026;

export async function getOpportunityById(id: number): Promise<Opportunity> {
    const result = await pool.query('SELECT * FROM opportunities WHERE id = $1', [id]);
    if (result.rows.length === 0) {
        throw new Error('Opportunity not found');
    }
    return result.rows[0];
}

const VALID_TRANSITIONS: Record<OpportunityStage, OpportunityStage[]> = {
  [OpportunityStage.LEAD_ASSIGNED]: [OpportunityStage.CONTACTED, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.CONTACTED]: [OpportunityStage.DISCOVERY, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.DISCOVERY]: [OpportunityStage.MOCKUP_REQUESTED, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.MOCKUP_REQUESTED]: [OpportunityStage.MOCKUP_DELIVERED, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.MOCKUP_DELIVERED]: [OpportunityStage.INVOICE_SENT, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.INVOICE_SENT]: [OpportunityStage.DECISION_PENDING, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.DECISION_PENDING]: [OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.CLOSED_WON]: [],
  [OpportunityStage.CLOSED_LOST]: [],
};

function normalizeChannelType(value: unknown): OpportunityChannelType | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const normalized = value.toUpperCase() as OpportunityChannelType;
  return REQUIRED_CHANNELS.includes(normalized) ? normalized : null;
}

export async function createOpportunity(opportunity: Partial<Opportunity>): Promise<Opportunity> {
  const { name, organization_id, sport, season, year, status, value, created_by, updated_by, stage, next_action, expected_close_date, last_activity_date, assigned_rep_id, assigned_director_id, estimated_revenue, deal_type, channel_type } = opportunity;
  const resolvedSport = sport ?? DEFAULT_SPORT;
  const resolvedSeason = season ?? DEFAULT_SEASON;
  const resolvedYear = year ?? DEFAULT_YEAR;
  const resolvedChannelType = normalizeChannelType(channel_type ?? deal_type ?? 'UNIFORM');

  if (!resolvedChannelType) {
    throw new Error('channel_type is required and must be one of UNIFORM, TRAVEL_GEAR, TEAM_STORE, LETTERMAN');
  }

  const existing = await pool.query(
    `SELECT 1
     FROM opportunities
     WHERE organization_id = $1
       AND channel_type = $2
       AND sport = $3
       AND season = $4
       AND year = $5
     LIMIT 1`,
    [organization_id, resolvedChannelType, resolvedSport, resolvedSeason, resolvedYear]
  );

  if (existing.rows.length > 0) {
    throw new Error('Opportunity already exists for this organization, sport, season, year, and channel');
  }

  const result = await pool.query(
    'INSERT INTO opportunities (name, organization_id, sport, season, year, status, value, created_by, updated_by, stage, next_action, expected_close_date, last_activity_date, assigned_rep_id, assigned_director_id, estimated_revenue, deal_type, channel_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *',
    [
      name,
      organization_id,
      resolvedSport,
      resolvedSeason,
      resolvedYear,
      status || 'open',
      value ?? 0,
      created_by,
      updated_by,
      stage || OpportunityStage.LEAD_ASSIGNED,
      next_action,
      expected_close_date,
      last_activity_date || new Date(),
      assigned_rep_id,
      assigned_director_id,
      estimated_revenue,
      deal_type || resolvedChannelType,
      resolvedChannelType,
    ]
  );
  return result.rows[0];
}

export async function getOpportunitiesByOrganization(organizationId: string): Promise<Opportunity[]> {
  const result = await pool.query('SELECT * FROM opportunities WHERE organization_id = $1', [organizationId]);
  return result.rows;
}

export async function getOpportunities(): Promise<Opportunity[]> {
  const result = await pool.query('SELECT * FROM opportunities ORDER BY updated_at DESC, id DESC');
  return result.rows;
}

export async function getOrganizationChannelPenetration(organizationId: number) {
  const result = await pool.query<Pick<Opportunity, 'channel_type' | 'stage'>>(
    'SELECT channel_type, stage FROM opportunities WHERE organization_id = $1 AND channel_type IS NOT NULL',
    [organizationId]
  );

  const channels = {
    uniform: OpportunityStage.LEAD_ASSIGNED,
    travel_gear: OpportunityStage.LEAD_ASSIGNED,
    team_store: OpportunityStage.LEAD_ASSIGNED,
    letterman: OpportunityStage.LEAD_ASSIGNED,
  };

  for (const row of result.rows) {
    if (row.channel_type === OpportunityChannelType.UNIFORM) channels.uniform = row.stage;
    if (row.channel_type === OpportunityChannelType.TRAVEL_GEAR) channels.travel_gear = row.stage;
    if (row.channel_type === OpportunityChannelType.TEAM_STORE) channels.team_store = row.stage;
    if (row.channel_type === OpportunityChannelType.LETTERMAN) channels.letterman = row.stage;
  }

  const closedWonCount = Object.values(channels).filter((stageValue) => stageValue === OpportunityStage.CLOSED_WON).length;

  return {
    channels,
    channel_penetration_score: closedWonCount / REQUIRED_CHANNELS.length,
  };
}

export async function updateOpportunityStage(
  opportunityId: number,
  toStage: OpportunityStage,
  changedBy: number,
  note?: string,
  financialData?: Partial<Opportunity>
): Promise<Opportunity> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const currentOpportunityResult = await client.query<Opportunity>(
      'SELECT * FROM opportunities WHERE id = $1 FOR UPDATE',
      [opportunityId]
    );

    if (currentOpportunityResult.rows.length === 0) {
      throw new Error('Opportunity not found');
    }

    const currentOpp = currentOpportunityResult.rows[0];
    const fromStage = currentOpp.stage;
    const isValidTransition = Boolean(VALID_TRANSITIONS[fromStage]?.includes(toStage));

    if (!isValidTransition) {
      throw new Error(`Invalid stage transition from ${fromStage} to ${toStage}`);
    }

    const mergedFinancialData = { ...currentOpp, ...financialData };
    let gross_profit: number | null = currentOpp.gross_profit ?? null;
    let closed_at: Date | null = currentOpp.closed_at ?? null;
    let actual_revenue: number | undefined | null = currentOpp.actual_revenue ?? null;
    let actual_cost: number | undefined | null = currentOpp.actual_cost ?? null;
    let loss_reason: string | undefined | null = currentOpp.loss_reason ?? null;

    if (toStage === OpportunityStage.CLOSED_WON) {
      actual_revenue = mergedFinancialData.actual_revenue;
      actual_cost = mergedFinancialData.actual_cost;
      if (actual_revenue === null || actual_cost === null || actual_revenue === undefined || actual_cost === undefined) {
        throw new Error('actual_revenue and actual_cost are required to close an opportunity as won');
      }
      gross_profit = Number(actual_revenue) - Number(actual_cost);
      if (gross_profit < 0) {
        throw new Error('gross_profit cannot be negative when closing an opportunity as won');
      }
      closed_at = new Date();
      loss_reason = null;
    } else if (toStage === OpportunityStage.CLOSED_LOST) {
      loss_reason = mergedFinancialData.loss_reason;
      if (!loss_reason) {
        throw new Error('loss_reason is required to close an opportunity as lost');
      }
      closed_at = new Date();
    } else if (financialData) {
      actual_revenue = financialData.actual_revenue ?? actual_revenue;
      actual_cost = financialData.actual_cost ?? actual_cost;
      loss_reason = financialData.loss_reason ?? loss_reason;
    }

    const actionTimestamp = new Date();
    const updatedOpportunityResult = await client.query<Opportunity>(
      `UPDATE opportunities
       SET
         stage = $1,
         last_activity_date = $2,
         updated_at = $2,
         actual_revenue = $3,
         actual_cost = $4,
         gross_profit = $5,
         closed_at = $6,
         loss_reason = $7,
         updated_by = $8
       WHERE id = $9
       RETURNING *`,
      [
        toStage,
        actionTimestamp,
        actual_revenue,
        actual_cost,
        gross_profit,
        closed_at,
        loss_reason,
        changedBy,
        opportunityId,
      ]
    );

    const updatedOpp = updatedOpportunityResult.rows[0];

    await client.query<OpportunityStageHistory>(
      'INSERT INTO opportunity_stage_history (opportunity_id, from_stage, to_stage, changed_by, note) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [opportunityId, fromStage, toStage, changedBy, note]
    );

    if (toStage === OpportunityStage.CLOSED_WON) {
      await createCommission(updatedOpp, client);
      const existingOrderResult = await client.query<{ id: number }>(
        'SELECT id FROM orders WHERE opportunity_id = $1 LIMIT 1',
        [opportunityId]
      );

      if (existingOrderResult.rows.length === 0) {
        await client.query(
          'INSERT INTO orders (opportunity_id, organization_id, deal_type, status) VALUES ($1, $2, $3, $4)',
          [updatedOpp.id, updatedOpp.organization_id, updatedOpp.deal_type, 'CREATED']
        );
      }
    }

    await client.query('COMMIT');
    return updatedOpp;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in updateOpportunityStage:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function updateOpportunity(id: number, updates: Partial<Opportunity>): Promise<Opportunity> {
  const client = await pool.connect();
  try {
    const currentOpportunityResult = await client.query<Opportunity>('SELECT * FROM opportunities WHERE id = $1', [id]);
    if (currentOpportunityResult.rows.length === 0) {
      throw new Error('Opportunity not found');
    }

    const currentOpportunity = currentOpportunityResult.rows[0];
    const newOpportunity = { ...currentOpportunity, ...updates, updated_at: new Date() };

    const { name, organization_id, sport, season, year, status, value, created_by, updated_by, stage, next_action, expected_close_date, last_activity_date, assigned_rep_id, assigned_director_id, estimated_revenue, deal_type, channel_type, actual_revenue, actual_cost, gross_profit, closed_at, loss_reason } = newOpportunity;

    const result = await client.query(
      `UPDATE opportunities SET
        name = $1, organization_id = $2, sport = $3, season = $4, year = $5, status = $6, value = $7, created_by = $8, updated_by = $9, stage = $10, next_action = $11, expected_close_date = $12, last_activity_date = $13, assigned_rep_id = $14, assigned_director_id = $15, estimated_revenue = $16, deal_type = $17, channel_type = $18, actual_revenue = $19, actual_cost = $20, gross_profit = $21, closed_at = $22, loss_reason = $23, updated_at = $24
      WHERE id = $25
      RETURNING *`,
      [name, organization_id, sport, season, year, status, value, created_by, updated_by, stage, next_action, expected_close_date, last_activity_date, assigned_rep_id, assigned_director_id, estimated_revenue, deal_type, channel_type, actual_revenue, actual_cost, gross_profit, closed_at, loss_reason, newOpportunity.updated_at, id]
    );

    return result.rows[0];
  } finally {
    client.release();
  }
}
