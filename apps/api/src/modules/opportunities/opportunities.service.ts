import { pool } from '@packages/database';
import { PoolClient } from 'pg';
import { Opportunity, OpportunityStage, OpportunityStageHistory, PaymentConfirmationSource } from './opportunities.interface';
import { createCommission } from '../commissions/commissions.service';

export async function getOpportunityById(id: number, client?: PoolClient): Promise<Opportunity> {
    const db = client || pool;
    const result = await db.query('SELECT * FROM opportunities WHERE id = $1', [id]);
    if (result.rows.length === 0) {
        throw new Error('Opportunity not found');
    }
    return result.rows[0];
}

const VALID_TRANSITIONS: Record<OpportunityStage, OpportunityStage[]> = {
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

export async function updateOpportunityStage(opportunityId: number, toStage: OpportunityStage, changedBy: number, note?: string, financialData?: Partial<Opportunity>, client?: PoolClient): Promise<Opportunity> {
  const shouldReleaseClient = !client;
  const db = client || await pool.connect();
  
  try {
    const currentOpportunityResult = await db.query<Opportunity>(
      'SELECT * FROM opportunities WHERE id = $1',
      [opportunityId]
    );

    if (currentOpportunityResult.rows.length === 0) {
      throw new Error('Opportunity not found');
    }

    const currentOpp = currentOpportunityResult.rows[0];
    const fromStage = currentOpp.stage as OpportunityStage;

    if (!VALID_TRANSITIONS[fromStage] || !VALID_TRANSITIONS[fromStage].includes(toStage)) {
      throw new Error(`Invalid stage transition from ${fromStage} to ${toStage}`);
    }

    const updatePayload = {
      actual_revenue: financialData?.actual_revenue ?? currentOpp.actual_revenue,
      actual_cost: financialData?.actual_cost ?? currentOpp.actual_cost,
      loss_reason: financialData?.loss_reason ?? currentOpp.loss_reason,
      gross_profit: currentOpp.gross_profit,
      closed_at: currentOpp.closed_at,
    };

    if (toStage === OpportunityStage.CLOSED_WON) {
      if (updatePayload.actual_revenue === null || updatePayload.actual_cost === null || updatePayload.actual_revenue === undefined || updatePayload.actual_cost === undefined) {
        throw new Error('actual_revenue and actual_cost are required to close an opportunity as won');
      }
      // @ts-ignore
      updatePayload.gross_profit = (updatePayload.actual_revenue) - (updatePayload.actual_cost);
      updatePayload.closed_at = new Date();
    } else if (toStage === OpportunityStage.CLOSED_LOST) {
      if (!updatePayload.loss_reason) {
        throw new Error('loss_reason is required to close an opportunity as lost');
      }
      updatePayload.closed_at = new Date();
    }

    if (!client) await (db as PoolClient).query('BEGIN');

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

    const updatedOpportunityResult = await db.query<Opportunity>(updateQuery, [
      toStage,
      new Date(),
      updatePayload.actual_revenue,
      updatePayload.actual_cost,
      updatePayload.gross_profit,
      updatePayload.closed_at,
      updatePayload.loss_reason,
      opportunityId,
    ]);

    const updatedOpp = updatedOpportunityResult.rows[0];

    await db.query<OpportunityStageHistory>(
      'INSERT INTO opportunity_stage_history (opportunity_id, from_stage, to_stage, changed_by, note) VALUES ($1, $2, $3, $4, $5) RETURNING *'
      , [opportunityId, fromStage, toStage, changedBy, note]
    );

    if (toStage === OpportunityStage.CLOSED_WON) {
      await createCommission(updatedOpp, db as PoolClient);
    }

    if (!client) await (db as PoolClient).query('COMMIT');
    return updatedOpp;
  } catch (error) {
    if (!client) await (db as PoolClient).query('ROLLBACK');
    throw error;
  } finally {
    if (shouldReleaseClient) (db as PoolClient).release();
  }
}

export async function confirmPayment(
  opportunityId: number,
  confirmationDetails: {
    source: 'FINANCE_CONFIRMATION' | 'PAYPAL_WEBHOOK';
    confirmedByUserId?: number | null;
  }
): Promise<Opportunity> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let opportunity = await getOpportunityById(opportunityId, client);

    if (opportunity.stage === OpportunityStage.CLOSED_WON) {
      await client.query('COMMIT');
      return opportunity;
    }

    if (opportunity.stage !== OpportunityStage.INVOICE_SENT && opportunity.stage !== OpportunityStage.PAYMENT_RECEIVED) {
      throw new Error('Payment can only be confirmed for opportunities in INVOICE_SENT');
    }

    if (opportunity.stage === OpportunityStage.INVOICE_SENT) {
      if (!opportunity.payment_received_at) {
        const now = new Date();
        await client.query(
          `UPDATE opportunities
           SET
             payment_received_at = $1,
             payment_confirmation_source = $2,
             payment_confirmation_user_id = $3,
             updated_at = $1
           WHERE id = $4`,
          [now, confirmationDetails.source, confirmationDetails.confirmedByUserId, opportunityId]
        );
      }
      opportunity = await updateOpportunityStage(opportunityId, OpportunityStage.PAYMENT_RECEIVED, confirmationDetails.confirmedByUserId || 1, 'Payment confirmed', undefined, client);
      opportunity = await getOpportunityById(opportunityId, client); // Refetch to get latest data
        opportunity = await getOpportunityById(opportunityId, client);
    }

    if (!opportunity.actual_revenue || !opportunity.actual_cost) {
        throw new Error('Cannot close opportunity: financial data missing');
    }

    const finalOpp = await updateOpportunityStage(opportunityId, OpportunityStage.CLOSED_WON, confirmationDetails.confirmedByUserId || 1, 'Opportunity closed won after payment.', { actual_revenue: opportunity.actual_revenue, actual_cost: opportunity.actual_cost }, client);

    await client.query('COMMIT');
    return finalOpp;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
