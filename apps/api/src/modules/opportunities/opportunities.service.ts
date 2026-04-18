import { pool } from '@packages/database';
import { Opportunity, OpportunityStage, OpportunityStageHistory } from './opportunities.interface';
import { createCommission } from '../commissions/commissions.service';

export async function getOpportunityById(id: number): Promise<Opportunity> {
    const result = await pool.query('SELECT * FROM opportunities WHERE id = $1', [id]);
    if (result.rows.length === 0) {
        throw new Error('Opportunity not found');
    }
    return result.rows[0];
}

const VALID_TRANSITIONS: Record<OpportunityStage, OpportunityStage[]> = {
  [OpportunityStage.LEAD_ASSIGNED]: [OpportunityStage.CONTACTED, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.CONTACTED]: [OpportunityStage.CONVERSATION_STARTED, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.CONVERSATION_STARTED]: [OpportunityStage.NEEDS_IDENTIFIED, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.NEEDS_IDENTIFIED]: [OpportunityStage.PROPOSAL_SENT, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.PROPOSAL_SENT]: [OpportunityStage.DECISION_PENDING, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.DECISION_PENDING]: [OpportunityStage.CLOSED_WON, OpportunityStage.CLOSED_LOST],
  [OpportunityStage.CLOSED_WON]: [],
  [OpportunityStage.CLOSED_LOST]: [],
};


export async function createOpportunity(opportunity: Partial<Opportunity>): Promise<Opportunity> {
  const { name, organization_id, status, value, created_by, updated_by, stage, next_action, expected_close_date, last_activity_date, assigned_rep_id, assigned_director_id, estimated_revenue, deal_type } = opportunity;
  const result = await pool.query(
    'INSERT INTO opportunities (name, organization_id, status, value, created_by, updated_by, stage, next_action, expected_close_date, last_activity_date, assigned_rep_id, assigned_director_id, estimated_revenue, deal_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
    [name, organization_id, status, value, created_by, updated_by, stage || OpportunityStage.LEAD_ASSIGNED, next_action, expected_close_date, last_activity_date || new Date(), assigned_rep_id, assigned_director_id, estimated_revenue, deal_type]
  );
  return result.rows[0];
}

export async function getOpportunitiesByOrganization(organizationId: string): Promise<Opportunity[]> {
  const result = await pool.query('SELECT * FROM opportunities WHERE organization_id = $1', [organizationId]);
  return result.rows;
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
