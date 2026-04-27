import { pool } from '@packages/database';
import { OpportunityStage } from '../opportunities/opportunities.interface';

export interface DashboardMetrics {
  total_opportunities_count: number;
  opportunities_by_stage: Record<OpportunityStage, number>;
  closed_won_count: number;
  closed_lost_count: number;
  total_actual_revenue: number;
  total_gross_profit: number;
  total_rep_commission: number;
  total_director_override: number;
}

function emptyStageCounts(): Record<OpportunityStage, number> {
  return {
    [OpportunityStage.LEAD_ASSIGNED]: 0,
    [OpportunityStage.CONTACTED]: 0,
    [OpportunityStage.DISCOVERY]: 0,
    [OpportunityStage.MOCKUP_REQUESTED]: 0,
    [OpportunityStage.MOCKUP_DELIVERED]: 0,
    [OpportunityStage.INVOICE_SENT]: 0,
    [OpportunityStage.DECISION_PENDING]: 0,
    [OpportunityStage.CLOSED_WON]: 0,
    [OpportunityStage.CLOSED_LOST]: 0,
  };
}

async function getDashboardMetrics(whereSql = '', params: Array<number> = []): Promise<DashboardMetrics> {
  const totalsQuery = `
    SELECT
      COUNT(*)::int AS total_opportunities_count,
      COUNT(*) FILTER (WHERE o.stage = '${OpportunityStage.CLOSED_WON}')::int AS closed_won_count,
      COUNT(*) FILTER (WHERE o.stage = '${OpportunityStage.CLOSED_LOST}')::int AS closed_lost_count,
      COALESCE(SUM(o.actual_revenue), 0)::float8 AS total_actual_revenue,
      COALESCE(SUM(o.gross_profit), 0)::float8 AS total_gross_profit,
      COALESCE(SUM(c.rep_commission), 0)::float8 AS total_rep_commission,
      COALESCE(SUM(c.director_override), 0)::float8 AS total_director_override
    FROM opportunities o
    LEFT JOIN commissions c ON c.opportunity_id = o.id
    ${whereSql}
  `;

  const stageQuery = `
    SELECT stage, COUNT(*)::int AS count
    FROM opportunities
    ${whereSql}
    GROUP BY stage
  `;

  const [totalsResult, stageResult] = await Promise.all([
    pool.query(totalsQuery, params),
    pool.query(stageQuery, params),
  ]);

  const totals = totalsResult.rows[0];
  const opportunities_by_stage = emptyStageCounts();

  for (const row of stageResult.rows) {
    const stage = row.stage as OpportunityStage;
    if (stage in opportunities_by_stage) {
      opportunities_by_stage[stage] = Number(row.count);
    }
  }

  return {
    total_opportunities_count: Number(totals?.total_opportunities_count ?? 0),
    opportunities_by_stage,
    closed_won_count: Number(totals?.closed_won_count ?? 0),
    closed_lost_count: Number(totals?.closed_lost_count ?? 0),
    total_actual_revenue: Number(totals?.total_actual_revenue ?? 0),
    total_gross_profit: Number(totals?.total_gross_profit ?? 0),
    total_rep_commission: Number(totals?.total_rep_commission ?? 0),
    total_director_override: Number(totals?.total_director_override ?? 0),
  };
}

export async function getOwnerDashboardMetrics(): Promise<DashboardMetrics> {
  return getDashboardMetrics();
}

export async function getDirectorDashboardMetrics(directorId: number): Promise<DashboardMetrics> {
  return getDashboardMetrics('WHERE o.assigned_director_id = $1', [directorId]);
}

export async function getRepDashboardMetrics(repId: number): Promise<DashboardMetrics> {
  return getDashboardMetrics('WHERE o.assigned_rep_id = $1', [repId]);
}
