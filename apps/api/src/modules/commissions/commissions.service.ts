import { pool } from '@packages/database';
import { Commission, CommissionStatus } from './commissions.interface';
import { Opportunity } from '../opportunities/opportunities.interface';

type Queryable = Pick<typeof pool, 'query'>;

const REP_BASE_RATES: { [key: string]: number } = {
  UNIFORM: 0.10,
  TRAVEL_GEAR: 0.10,
  TEAM_STORE: 0.15,
  LETTERMAN: 0.18,
  DEFAULT: 0.10,
};

const DIRECTOR_OVERRIDE_RATE = 0.05;

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function requireValidCommissionSource(opportunity: Opportunity) {
  if (opportunity.gross_profit === null || opportunity.gross_profit === undefined) {
    return false;
  }

  if (Number(opportunity.gross_profit) < 0) {
    throw new Error('gross_profit cannot be negative for commission creation');
  }

  if (!opportunity.assigned_rep_id) {
    throw new Error('assigned_rep_id is required for commission creation');
  }

  return true;
}

export async function createCommission(opportunity: Opportunity, db: Queryable = pool): Promise<Commission | null> {
  if (!requireValidCommissionSource(opportunity)) {
    return null;
  }

  const existingCommission = await db.query('SELECT * FROM commissions WHERE opportunity_id = $1', [opportunity.id]);
  if (existingCommission.rows.length > 0) {
    return existingCommission.rows[0];
  }

  const dealType = opportunity.deal_type || 'UNIFORM';
  const repRate = REP_BASE_RATES[dealType] || REP_BASE_RATES.DEFAULT;
  const grossProfit = roundCurrency(Number(opportunity.gross_profit));
  const repCommission = roundCurrency(grossProfit * repRate);
  const directorOverride = roundCurrency(grossProfit * DIRECTOR_OVERRIDE_RATE);

  const result = await db.query(
    'INSERT INTO commissions (opportunity_id, rep_user_id, director_user_id, gross_profit, rep_rate, rep_commission, director_rate, director_override, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
    [
      opportunity.id,
      opportunity.assigned_rep_id,
      opportunity.assigned_director_id ?? opportunity.assigned_rep_id,
      grossProfit,
      repRate,
      repCommission,
      DIRECTOR_OVERRIDE_RATE,
      directorOverride,
      CommissionStatus.PENDING,
    ]
  );

  return result.rows[0];
}
