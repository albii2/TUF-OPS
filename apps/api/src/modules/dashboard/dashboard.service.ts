import { pool } from '@packages/database';

export async function getExecutiveDashboard() {
  // Decisions: open critical + high priority intake items
  const decisions = await pool.query(
    `SELECT * FROM executive_intake 
     WHERE status = 'open' AND (priority = 'critical' OR priority = 'high')
     ORDER BY CASE priority WHEN 'critical' THEN 0 ELSE 1 END, created_at DESC
     LIMIT 10`
  );

  // HR: people in pipeline needing action
  const hr = await pool.query(
    `SELECT candidate_name, current_stage, assigned_hr, notes
     FROM people_pipeline 
     WHERE status = 'active' AND current_stage NOT IN ('first_order', 'first_proposal')
     ORDER BY created_at DESC LIMIT 10`
  );

  // Waiting/Overdue: open items older than 7 days
  const overdue = await pool.query(
    `SELECT * FROM executive_intake 
     WHERE status = 'open' AND created_at < NOW() - INTERVAL '7 days'
     ORDER BY created_at ASC LIMIT 10`
  );

  // Pipeline stats
  const pipelineStats = await pool.query(
    `SELECT current_stage, COUNT(*) as count FROM people_pipeline WHERE status = 'active' GROUP BY current_stage`
  );

  // Revenue blockers: high priority, open, tagged 'revenue'
  const revenueBlockers = await pool.query(
    `SELECT * FROM executive_intake 
     WHERE status = 'open' AND 'revenue' = ANY(tags)
     ORDER BY priority LIMIT 5`
  );

  return {
    decisions: decisions.rows,
    hr: hr.rows,
    overdue: overdue.rows,
    pipelineStats: pipelineStats.rows,
    revenueBlockers: revenueBlockers.rows,
  };
}
