import { pool } from '@packages/database';

async function safeQuery<T>(queryFn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await queryFn(); } catch { return fallback; }
}

export async function getExecutiveDashboard() {
  const empty = { rows: [] } as any;

  const [decisions, hr, overdue, pipelineStats, revenueBlockers,
    recruiting, sales, ops, waiting, dailyBrief] = await Promise.all([
    safeQuery(() => pool.query(
      `SELECT * FROM executive_intake WHERE status = 'open' AND (priority = 'critical' OR priority = 'high')
       ORDER BY CASE priority WHEN 'critical' THEN 0 ELSE 1 END, created_at DESC LIMIT 10`), empty),

    safeQuery(() => pool.query(
      `SELECT candidate_name, current_stage, assigned_hr, notes FROM people_pipeline
       WHERE status = 'active' AND current_stage NOT IN ('first_order', 'first_proposal')
       ORDER BY created_at DESC LIMIT 10`), empty),

    safeQuery(() => pool.query(
      `SELECT * FROM executive_intake WHERE status = 'open' AND created_at < NOW() - INTERVAL '7 days'
       ORDER BY created_at ASC LIMIT 10`), empty),

    safeQuery(() => pool.query(
      `SELECT current_stage, COUNT(*) as count FROM people_pipeline WHERE status = 'active' GROUP BY current_stage`), empty),

    safeQuery(() => pool.query(
      `SELECT * FROM executive_intake WHERE status = 'open' AND 'revenue' = ANY(tags) ORDER BY priority LIMIT 5`), empty),

    safeQuery(() => pool.query(
      `SELECT c.first_name || ' ' || c.last_name AS name, c.stage, c.assigned_director_id AS owner_id,
       'REP' AS role, c.updated_at FROM candidates c
       WHERE c.stage NOT IN ('rejected', 'hired') ORDER BY c.updated_at DESC NULLS LAST LIMIT 10`), empty),

    safeQuery(() => pool.query(
      `SELECT o.id, o.name AS title, o.stage, o.assigned_rep_id, o.value, o.next_action, o.expected_close_date
       FROM opportunities o WHERE o.stage IN ('PROPOSAL_SENT','proposal_sent','NEGOTIATION','negotiation')
       ORDER BY o.expected_close_date ASC NULLS LAST LIMIT 10`), empty),

    safeQuery(() => pool.query(
      `SELECT ord.id, ord.status, ord.assigned_rep_id, o.name AS opportunity_name, ord.updated_at
       FROM orders ord JOIN opportunities o ON o.id = ord.opportunity_id
       WHERE ord.status IN ('IN_PRODUCTION','in_production','QUALITY_CONTROL','quality_control',
                            'READY_FOR_OPS','ready_for_ops','ORDER_ASSEMBLY','order_assembly')
       ORDER BY ord.updated_at ASC NULLS LAST LIMIT 10`), empty),

    safeQuery(() => pool.query(
      `SELECT * FROM executive_intake WHERE status = 'open' AND (owner IS NULL OR owner = '')
       ORDER BY created_at DESC LIMIT 10`), empty),

    safeQuery(() => pool.query(
      `SELECT
        (SELECT COUNT(*) FROM executive_intake WHERE status = 'open' AND (priority = 'critical' OR priority = 'high')) AS open_decisions,
        (SELECT COUNT(*) FROM executive_intake WHERE status = 'open' AND 'revenue' = ANY(tags)) AS revenue_blockers,
        (SELECT COUNT(*) FROM people_pipeline WHERE status = 'active') AS active_candidates,
        (SELECT COUNT(*) FROM candidates WHERE stage NOT IN ('rejected', 'hired')) AS active_recruits,
        (SELECT COUNT(*) FROM opportunities WHERE stage IN ('PROPOSAL_SENT','proposal_sent','NEGOTIATION','negotiation')) AS near_close_deals,
        (SELECT COUNT(*) FROM orders WHERE status IN ('IN_PRODUCTION','in_production','QUALITY_CONTROL','quality_control','READY_FOR_OPS','ready_for_ops')) AS active_orders,
        (SELECT COUNT(*) FROM executive_intake WHERE status = 'open' AND created_at < NOW() - INTERVAL '7 days') AS overdue_items,
        (SELECT COUNT(*) FROM executive_intake WHERE status = 'open' AND (owner IS NULL OR owner = '')) AS waiting_items`), empty),
  ]);

  return {
    decisions: decisions.rows, hr: hr.rows, overdue: overdue.rows,
    pipelineStats: pipelineStats.rows, revenueBlockers: revenueBlockers.rows,
    recruiting: recruiting.rows, sales: sales.rows, ops: ops.rows,
    waiting: waiting.rows, dailyBrief: dailyBrief.rows[0] || {},
  };
}
