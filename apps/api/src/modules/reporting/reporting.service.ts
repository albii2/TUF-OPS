import { pool } from '@packages/database';
import { OpportunityStage } from '../opportunities/opportunities.interface';

export interface DashboardMetrics {
  assigned_schools: number;
  touched_schools: number;
  untouched_schools: number;
  active_opportunities: number;
  follow_ups_due: number;
  action_needed_items: number;
  closed_won_count: number;
  paid_order_count: number;
  paid_revenue: number;
  gross_profit: number;
  rep_commission_estimate: number;
  director_override_estimate: number;
  month_to_date_activity: number;
  total_opportunities_count: number;
  opportunities_by_stage: Record<OpportunityStage, number>;
  closed_lost_count: number;
  total_actual_revenue: number;
  total_gross_profit: number;
  total_rep_commission: number;
  total_director_override: number;
}

type Scope = { where: string; params: number[]; commissionVisibility: 'admin' | 'director' | 'rep' };

const AUDITABLE_TOUCH_TYPES = ['CALL', 'EMAIL', 'TEXT', 'MEETING', 'NOTE', 'OPPORTUNITY_ACTIVITY', 'LOGGED_CONTACT'];
const PAYABLE_ORDER_STATUSES = ['DELIVERED', 'COMPLETED'];

function emptyStageCounts(): Record<OpportunityStage, number> {
  return {
    [OpportunityStage.LEAD_ENGAGED]: 0,
    [OpportunityStage.DISCOVERY]: 0,
    [OpportunityStage.MOCKUP_STAGE]: 0,
    [OpportunityStage.INVOICE_SENT]: 0,
    [OpportunityStage.CLOSED_WON]: 0,
    [OpportunityStage.CLOSED_LOST]: 0,
  } as unknown as Record<OpportunityStage, number>;
}

function repScope(repId: number): Scope {
  return { where: 'WHERE org.assigned_rep_id = $1', params: [repId], commissionVisibility: 'rep' };
}

function directorScope(directorId: number): Scope {
  return { where: 'WHERE org.assigned_director_id = $1', params: [directorId], commissionVisibility: 'director' };
}

function adminScope(): Scope {
  return { where: '', params: [], commissionVisibility: 'admin' };
}

async function getDashboardMetrics(scope: Scope): Promise<DashboardMetrics> {
  const params = scope.params;
  const orgScope = scope.where;
  const opportunityScope = orgScope.replace(/org\./g, 'o.');
  const orderScope = orgScope
    .replace(/org\.assigned_rep_id/g, 'COALESCE(ord.assigned_rep_id, o.assigned_rep_id)')
    .replace(/org\.assigned_director_id/g, 'COALESCE(ord.assigned_director_id, o.assigned_director_id)')
    .replace(/org\./g, 'ord.');

  const [schoolResult, opportunityResult, stageResult, orderResult, activityResult] = await Promise.all([
    pool.query(`
      WITH scoped AS (SELECT org.id FROM organizations org ${orgScope}),
      touched AS (
        SELECT DISTINCT a.organization_id
        FROM activities a
        JOIN scoped s ON s.id = a.organization_id
        WHERE upper(a.type) = ANY($${params.length + 1}::text[])
      )
      SELECT
        COUNT(s.id)::int AS assigned_schools,
        COUNT(t.organization_id)::int AS touched_schools,
        (COUNT(s.id) - COUNT(t.organization_id))::int AS untouched_schools
      FROM scoped s
      LEFT JOIN touched t ON t.organization_id = s.id
    `, [...params, AUDITABLE_TOUCH_TYPES]),
    pool.query(`
      SELECT
        COUNT(*)::int AS total_opportunities_count,
        COUNT(*) FILTER (WHERE o.stage NOT IN ('${OpportunityStage.CLOSED_WON}', '${OpportunityStage.CLOSED_LOST}'))::int AS active_opportunities,
        COUNT(*) FILTER (WHERE o.stage = '${OpportunityStage.CLOSED_WON}')::int AS closed_won_count,
        COUNT(*) FILTER (WHERE o.stage = '${OpportunityStage.CLOSED_LOST}')::int AS closed_lost_count,
        COUNT(*) FILTER (WHERE o.next_action IS NOT NULL OR (o.expected_close_date IS NOT NULL AND o.expected_close_date <= NOW()))::int AS action_needed_items,
        COALESCE(SUM(o.actual_revenue), 0)::float8 AS total_actual_revenue,
        COALESCE(SUM(o.gross_profit), 0)::float8 AS total_gross_profit
      FROM opportunities o
      ${opportunityScope}
    `, params),
    pool.query(`SELECT o.stage, COUNT(*)::int AS count FROM opportunities o ${opportunityScope} GROUP BY o.stage`, params),
    pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE ord.status = ANY($${params.length + 1}::text[]))::int AS paid_order_count,
        COALESCE(SUM(o.actual_revenue) FILTER (WHERE ord.status = ANY($${params.length + 1}::text[])), 0)::float8 AS paid_revenue,
        COALESCE(SUM(o.gross_profit) FILTER (WHERE ord.status = ANY($${params.length + 1}::text[])), 0)::float8 AS gross_profit,
        COALESCE(SUM(c.rep_commission) FILTER (WHERE ord.status = ANY($${params.length + 1}::text[])), 0)::float8 AS rep_commission_estimate,
        COALESCE(SUM(c.director_override) FILTER (WHERE ord.status = ANY($${params.length + 1}::text[])), 0)::float8 AS director_override_estimate
      FROM orders ord
      JOIN opportunities o ON o.id = ord.opportunity_id
      LEFT JOIN commissions c ON c.opportunity_id = o.id
      ${orderScope}
    `, [...params, PAYABLE_ORDER_STATUSES]),
    pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE a.completed = false AND a.due_date IS NOT NULL AND a.due_date <= NOW())::int AS follow_ups_due,
        COUNT(*) FILTER (WHERE a.created_at >= date_trunc('month', NOW()))::int AS month_to_date_activity
      FROM activities a
      JOIN organizations org ON org.id = a.organization_id
      ${orgScope}
    `, params),
  ]);

  const opportunities_by_stage = emptyStageCounts();
  for (const row of stageResult.rows) {
    const stage = row.stage as OpportunityStage;
    if (stage in opportunities_by_stage) opportunities_by_stage[stage] = Number(row.count);
  }

  const schools = schoolResult.rows[0] ?? {};
  const opps = opportunityResult.rows[0] ?? {};
  const orders = orderResult.rows[0] ?? {};
  const activity = activityResult.rows[0] ?? {};
  const repCommission = scope.commissionVisibility === 'director' ? 0 : Number(orders.rep_commission_estimate ?? 0);
  const directorOverride = scope.commissionVisibility === 'rep' ? 0 : Number(orders.director_override_estimate ?? 0);

  return {
    assigned_schools: Number(schools.assigned_schools ?? 0),
    touched_schools: Number(schools.touched_schools ?? 0),
    untouched_schools: Number(schools.untouched_schools ?? 0),
    active_opportunities: Number(opps.active_opportunities ?? 0),
    follow_ups_due: Number(activity.follow_ups_due ?? 0),
    action_needed_items: Number(opps.action_needed_items ?? 0),
    closed_won_count: Number(opps.closed_won_count ?? 0),
    paid_order_count: Number(orders.paid_order_count ?? 0),
    paid_revenue: Number(orders.paid_revenue ?? 0),
    gross_profit: Number(orders.gross_profit ?? 0),
    rep_commission_estimate: repCommission,
    director_override_estimate: directorOverride,
    month_to_date_activity: Number(activity.month_to_date_activity ?? 0),
    total_opportunities_count: Number(opps.total_opportunities_count ?? 0),
    opportunities_by_stage,
    closed_lost_count: Number(opps.closed_lost_count ?? 0),
    total_actual_revenue: Number(opps.total_actual_revenue ?? 0),
    total_gross_profit: Number(opps.total_gross_profit ?? 0),
    total_rep_commission: repCommission,
    total_director_override: directorOverride,
  };
}

export async function getOwnerDashboardMetrics(): Promise<DashboardMetrics> {
  return getDashboardMetrics(adminScope());
}

export async function getAdminDashboardMetrics(): Promise<DashboardMetrics> {
  return getDashboardMetrics(adminScope());
}

export async function getSchoolCoverageMetrics(): Promise<Pick<DashboardMetrics, 'assigned_schools' | 'touched_schools' | 'untouched_schools'>> {
  const metrics = await getDashboardMetrics(adminScope());
  return {
    assigned_schools: metrics.assigned_schools,
    touched_schools: metrics.touched_schools,
    untouched_schools: metrics.untouched_schools,
  };
}

export async function getCommissionMetrics(): Promise<Pick<DashboardMetrics, 'paid_order_count' | 'paid_revenue' | 'gross_profit' | 'rep_commission_estimate' | 'director_override_estimate'>> {
  const metrics = await getDashboardMetrics(adminScope());
  return {
    paid_order_count: metrics.paid_order_count,
    paid_revenue: metrics.paid_revenue,
    gross_profit: metrics.gross_profit,
    rep_commission_estimate: metrics.rep_commission_estimate,
    director_override_estimate: metrics.director_override_estimate,
  };
}

export async function getDirectorDashboardMetrics(directorId: number): Promise<DashboardMetrics> {
  return getDashboardMetrics(directorScope(directorId));
}

export async function getRepDashboardMetrics(repId: number): Promise<DashboardMetrics> {
  return getDashboardMetrics(repScope(repId));
}

async function getUserIdByEmail(email: string, expectedRole: 'DIRECTOR' | 'REP'): Promise<number> {
  const result = await pool.query(
    "SELECT id FROM users WHERE lower(email) = lower($1) AND role = $2 AND status = 'ACTIVE' ORDER BY id LIMIT 1",
    [email, expectedRole]
  );
  const id = result.rows[0]?.id;
  if (!id) throw new Error(`${expectedRole} user not found for dashboard email`);
  return Number(id);
}

export async function getDirectorDashboardMetricsByEmail(email: string): Promise<DashboardMetrics> {
  return getDirectorDashboardMetrics(await getUserIdByEmail(email, 'DIRECTOR'));
}

export async function getRepDashboardMetricsByEmail(email: string): Promise<DashboardMetrics> {
  return getRepDashboardMetrics(await getUserIdByEmail(email, 'REP'));
}
