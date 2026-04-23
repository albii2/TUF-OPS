import { pool } from '@packages/database';
import { Opportunity, OpportunityStage, OpportunityStageHistory, OpportunityChannelType } from './opportunities.interface';
import { createCommission } from '../commissions/commissions.service';

const REQUIRED_CHANNELS: OpportunityChannelType[] = [
  OpportunityChannelType.UNIFORM,
  OpportunityChannelType.TRAVEL_GEAR,
  OpportunityChannelType.TEAM_STORE,
  OpportunityChannelType.LETTERMAN,
];

export async function getOpportunityById(id: number): Promise<Opportunity> {
    const result = await pool.query('SELECT * FROM opportunities WHERE id = $1', [id]);
    if (result.rows.length === 0) {
        throw new Error('Opportunity not found');
    }
    return result.rows[0];
}

const VALID_TRANSITIONS: Record<OpportunityStage, OpportunityStage[]> = {
  [OpportunityStage.NOT_STARTED]: [OpportunityStage.LEAD_ASSIGNED, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.LEAD_ASSIGNED]: [OpportunityStage.CONTACT_INITIATED, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.CONTACT_INITIATED]: [OpportunityStage.MOCKUP_IN_PROGRESS, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.MOCKUP_IN_PROGRESS]: [OpportunityStage.MOCKUP_APPROVED, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.MOCKUP_APPROVED]: [OpportunityStage.SAMPLE_REQUESTED, OpportunityStage.INVOICE_SENT, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.SAMPLE_REQUESTED]: [OpportunityStage.SAMPLE_IN_PRODUCTION, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.SAMPLE_IN_PRODUCTION]: [OpportunityStage.SAMPLE_APPROVED, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.SAMPLE_APPROVED]: [OpportunityStage.INVOICE_SENT, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.INVOICE_SENT]: [OpportunityStage.PAYMENT_RECEIVED, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.PAYMENT_RECEIVED]: [OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.CLOSED_WON]: [],
  [OpportunityStage.CLOSED_LOST]: [],
};


async function createOrderForClosedWonOpportunity(client: any, opportunity: Opportunity) {
  await client.query(
    `INSERT INTO orders (opportunity_id, organization_id, deal_type, status)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (opportunity_id) DO NOTHING`,
    [opportunity.id, opportunity.organization_id, opportunity.deal_type, 'CREATED']
  );
}

function normalizeChannelType(value: unknown): OpportunityChannelType | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const normalized = value.toUpperCase() as OpportunityChannelType;
  return REQUIRED_CHANNELS.includes(normalized) ? normalized : null;
}

export async function createOpportunity(opportunity: Partial<Opportunity>): Promise<Opportunity> {
  const { name, organization_id, status, value, created_by, updated_by, stage, next_action, expected_close_date, last_activity_date, assigned_rep_id, assigned_director_id, estimated_revenue, deal_type, channel_type } = opportunity;
  const resolvedChannelType = normalizeChannelType(channel_type ?? deal_type);

  if (!resolvedChannelType) {
    throw new Error('channel_type is required and must be one of UNIFORM, TRAVEL_GEAR, TEAM_STORE, LETTERMAN');
  }

  const existing = await pool.query(
    'SELECT id FROM opportunities WHERE organization_id = $1 AND channel_type = $2 LIMIT 1',
    [organization_id, resolvedChannelType]
  );

  if (existing.rows.length > 0) {
    throw new Error(`Opportunity already exists for organization ${organization_id} and channel ${resolvedChannelType}`);
  }

  const result = await pool.query(
    'INSERT INTO opportunities (name, organization_id, status, value, created_by, updated_by, stage, next_action, expected_close_date, last_activity_date, assigned_rep_id, assigned_director_id, estimated_revenue, deal_type, channel_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *',
    [
      name,
      organization_id,
      status || 'open',
      value ?? 0,
      created_by,
      updated_by,
      stage || OpportunityStage.NOT_STARTED,
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

export async function getOrganizationChannelPenetration(organizationId: number) {
  const result = await pool.query<Pick<Opportunity, 'channel_type' | 'stage'>>(
    'SELECT channel_type, stage FROM opportunities WHERE organization_id = $1 AND channel_type IS NOT NULL',
    [organizationId]
  );

  const channels = {
    uniform: OpportunityStage.NOT_STARTED,
    travel_gear: OpportunityStage.NOT_STARTED,
    team_store: OpportunityStage.NOT_STARTED,
    letterman: OpportunityStage.NOT_STARTED,
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

export async function updateOpportunityStage(opportunityId: number, toStage: OpportunityStage, changedBy: number, note?: string, financialData?: Partial<Opportunity>): Promise<Opportunity> {
  const currentOpportunityResult = await pool.query<Opportunity>(
    'SELECT * FROM opportunities WHERE id = $1',
    [opportunityId]
  );

  if (currentOpportunityResult.rows.length === 0) {
    throw new Error('Opportunity not found');
  }

  const currentOpp = currentOpportunityResult.rows[0];
  const fromStage = currentOpp.stage;

  if (!VALID_TRANSITIONS[fromStage] || !VALID_TRANSITIONS[fromStage].includes(toStage)) {
    throw new Error(`Invalid stage transition from ${fromStage} to ${toStage}`);
  }

  let gross_profit: number | undefined;
  let closed_at: Date | null = null;

  if (toStage === OpportunityStage.CLOSED_WON) {
    const { actual_revenue, actual_cost } = { ...currentOpp, ...financialData };
    if (actual_revenue === null || actual_cost === null || actual_revenue === undefined || actual_cost === undefined) {
      throw new Error('actual_revenue and actual_cost are required to close an opportunity as won');
    }
    gross_profit = actual_revenue - actual_cost;
    closed_at = new Date();
  } else if (toStage === OpportunityStage.CLOSED_LOST) {
    const { loss_reason } = { ...currentOpp, ...financialData };
    if (!loss_reason) {
      throw new Error('loss_reason is required to close an opportunity as lost');
    }
    closed_at = new Date();
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateQuery = `
      UPDATE opportunities
      SET
        stage = $1,
        last_activity_date = $2,
        updated_at = current_timestamp,
        actual_revenue = $3,
        actual_cost = $4,
        gross_profit = $5,
        closed_at = $6,
        loss_reason = $7
      WHERE id = $8
      RETURNING *
    `;

    const updatedOpportunityResult = await client.query<Opportunity>(updateQuery, [
      toStage,
      new Date(),
      financialData?.actual_revenue,
      financialData?.actual_cost,
      gross_profit,
      closed_at,
      financialData?.loss_reason,
      opportunityId,
    ]);

    const updatedOpp = updatedOpportunityResult.rows[0];

    await client.query<OpportunityStageHistory>(
      'INSERT INTO opportunity_stage_history (opportunity_id, from_stage, to_stage, changed_by, note) VALUES ($1, $2, $3, $4, $5) RETURNING *'
      , [opportunityId, fromStage, toStage, changedBy, note]
    );

    if (toStage === OpportunityStage.CLOSED_WON) {
      await createCommission(updatedOpp);
      await createOrderForClosedWonOpportunity(client, updatedOpp);
    }

    await client.query('COMMIT');
    return updatedOpp;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}


export async function getOpportunities(): Promise<Opportunity[]> {
  const result = await pool.query('SELECT * FROM opportunities ORDER BY id DESC');
  return result.rows;
}
