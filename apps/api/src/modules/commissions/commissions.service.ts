import { pool } from '@packages/database';
import { Commission, CommissionStatus } from './commissions.interface';
import { Opportunity } from '../opportunities/opportunities.interface';

const REP_BASE_RATES: { [key: string]: number } = {
  UNIFORM: 0.10,
  TRAVEL_GEAR: 0.10,
  TEAM_STORE: 0.15,
  LETTERMAN: 0.18,
  DEFAULT: 0.10, // Default rate for any other type
};

const DIRECTOR_OVERRIDE_RATE = 0.05; // Default placeholder override rule

export async function createCommission(opportunity: Opportunity): Promise<Commission | null> {
  if (!opportunity.gross_profit) {
    return null;
  }

  const existingCommission = await pool.query('SELECT * FROM commissions WHERE opportunity_id = $1', [opportunity.id]);
  if (existingCommission.rows.length > 0) {
    return existingCommission.rows[0];
  }

  const dealType = opportunity.deal_type || 'UNIFORM'; // Default to UNIFORM if not specified
  const repRate = REP_BASE_RATES[dealType] || REP_BASE_RATES.DEFAULT;
  const repCommission = opportunity.gross_profit * repRate;
  const directorOverride = opportunity.gross_profit * DIRECTOR_OVERRIDE_RATE;

  console.log('COMMISSION DEBUG:', {
    opportunity_id: opportunity.id,
    assigned_rep_id: opportunity.assigned_rep_id,
    assigned_director_id: opportunity.assigned_director_id
  });

  const result = await pool.query(
    'INSERT INTO commissions (opportunity_id, rep_user_id, director_user_id, gross_profit, rep_rate, rep_commission, director_rate, director_override, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *'
    , [
      opportunity.id,
      opportunity.assigned_rep_id,
      opportunity.assigned_director_id,
      opportunity.gross_profit,
      repRate,
      repCommission,
      DIRECTOR_OVERRIDE_RATE,
      directorOverride,
      CommissionStatus.PENDING,
    ]
  );

  return result.rows[0];
}
