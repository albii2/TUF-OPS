import { pool } from '@packages/database';

export async function getOwnerDashboardData() {
  const nextPlaysQuery = `
    SELECT
      o.id,
      o.name AS opportunity_name,
      org.name AS organization_name,
      o.value AS revenue,
      o.stage,
      (SELECT changed_at FROM opportunity_stage_history WHERE opportunity_id = o.id ORDER BY changed_at DESC LIMIT 1) AS last_stage_change_at,
      o.next_action AS next_action_display,
      COALESCE('Rep ' || o.assigned_rep_id, 'Unassigned') AS rep_name,
      COALESCE('Director ' || o.assigned_director_id, 'Unassigned') AS director_name,
      CASE
        WHEN o.stage = 'CLOSED_WON' THEN 0
        WHEN o.stage = 'CLOSED_LOST' THEN 0
        ELSE 10
      END AS pressure_score
    FROM opportunities o
    LEFT JOIN organizations org ON org.id = o.organization_id
    WHERE o.stage NOT IN ('CLOSED_WON', 'CLOSED_LOST')
    ORDER BY pressure_score DESC
    LIMIT 10;
  `;

  const cashBoardQuery = `
    SELECT
      SUM(CASE WHEN o.stage = 'INVOICE_SENT' THEN o.value ELSE 0 END) AS pending_payment,
      SUM(CASE WHEN o.payment_received_at >= NOW() - INTERVAL '30 days' THEN o.value ELSE 0 END) AS recently_paid_amount,
      SUM(CASE WHEN o.stage = 'CLOSED_WON' AND o.closed_at >= NOW() - INTERVAL '30 days' THEN o.value ELSE 0 END) AS recently_closed_amount,
      AVG(CASE WHEN o.stage = 'PAYMENT_RECEIVED' THEN o.payment_received_at - o.created_at ELSE NULL END) AS avg_days_to_payment,
      (CAST(COUNT(CASE WHEN o.stage = 'CLOSED_WON' THEN 1 ELSE NULL END) AS DECIMAL) / COUNT(*)) * 100 AS conversion_rate
    FROM opportunities o;
  `;

  const pipelineFlowQuery = `
    SELECT
      stage AS stage_name,
      COUNT(*) AS count,
      CASE
        WHEN COUNT(*) > 10 THEN 'BOTTLENECK'
        ELSE 'HEALTHY'
      END AS status
    FROM opportunities
    GROUP BY stage;
  `;

  const opsReadyQuery = `
    SELECT
      COUNT(CASE WHEN o.status = 'NEEDS_ACTION' THEN 1 ELSE NULL END) AS needs_action,
      COUNT(CASE WHEN o.status = 'READY_FOR_VENDOR' THEN 1 ELSE NULL END) AS ready_for_vendor,
      COUNT(CASE WHEN o.status = 'IN_PRODUCTION' THEN 1 ELSE NULL END) AS in_production,
      COUNT(CASE WHEN o.status = 'STALLED' THEN 1 ELSE NULL END) AS stalled
    FROM orders o;
  `;

  const ownershipRepsQuery = `
    SELECT
        COALESCE(o.assigned_rep_id, 0) AS id,
        COALESCE('Rep ' || o.assigned_rep_id, 'Unassigned') AS name,
        COUNT(o.id) AS active_deals,
        COUNT(CASE WHEN (NOW() - (SELECT changed_at FROM opportunity_stage_history WHERE opportunity_id = o.id ORDER BY changed_at DESC LIMIT 1)) > INTERVAL '30 days' THEN 1 ELSE NULL END) AS stuck_deals,
        (CAST(COUNT(CASE WHEN (NOW() - (SELECT changed_at FROM opportunity_stage_history WHERE opportunity_id = o.id ORDER BY changed_at DESC LIMIT 1)) > INTERVAL '30 days' THEN 1 ELSE NULL END) AS DECIMAL) / COUNT(o.id)) AS stuck_ratio,
        SUM(o.value) AS total_revenue
    FROM
        opportunities o
    WHERE o.stage NOT IN ('CLOSED_WON', 'CLOSED_LOST')
    GROUP BY
        o.assigned_rep_id
    ORDER BY
        stuck_ratio DESC;
  `;

  const ownershipDirectorsQuery = `
    SELECT
        COALESCE(o.assigned_director_id, 0) AS id,
        COALESCE('Director ' || o.assigned_director_id, 'Unassigned') AS name,
        COUNT(o.id) AS active_deals,
        COUNT(CASE WHEN (NOW() - (SELECT changed_at FROM opportunity_stage_history WHERE opportunity_id = o.id ORDER BY changed_at DESC LIMIT 1)) > INTERVAL '30 days' THEN 1 ELSE NULL END) AS stuck_deals,
        (CAST(COUNT(CASE WHEN (NOW() - (SELECT changed_at FROM opportunity_stage_history WHERE opportunity_id = o.id ORDER BY changed_at DESC LIMIT 1)) > INTERVAL '30 days' THEN 1 ELSE NULL END) AS DECIMAL) / COUNT(o.id)) AS stuck_ratio,
        SUM(o.value) AS total_revenue
    FROM
        opportunities o
    WHERE o.stage NOT IN ('CLOSED_WON', 'CLOSED_LOST')
    GROUP BY
        o.assigned_director_id
    ORDER BY
        stuck_ratio DESC;
  `;

  const [nextPlays, cashBoard, pipelineFlow, opsReady, ownershipReps, ownershipDirectors] = await Promise.all([
    pool.query(nextPlaysQuery),
    pool.query(cashBoardQuery),
    pool.query(pipelineFlowQuery),
    pool.query(opsReadyQuery),
    pool.query(ownershipRepsQuery),
    pool.query(ownershipDirectorsQuery),
  ]);

  return {
    next_plays: nextPlays.rows,
    cash_board: cashBoard.rows[0],
    pipeline_flow: pipelineFlow.rows,
    ops_ready: opsReady.rows[0],
    ownership: {
      reps: ownershipReps.rows,
      directors: ownershipDirectors.rows,
    },
  };
}
