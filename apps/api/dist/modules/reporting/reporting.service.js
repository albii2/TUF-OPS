"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOwnerDashboardMetrics = getOwnerDashboardMetrics;
exports.getDirectorDashboardMetrics = getDirectorDashboardMetrics;
exports.getRepDashboardMetrics = getRepDashboardMetrics;
const database_1 = require("@packages/database");
const opportunities_interface_1 = require("../opportunities/opportunities.interface");
function emptyStageCounts() {
    return {
        [opportunities_interface_1.OpportunityStage.LEAD_ENGAGED]: 0,
        [opportunities_interface_1.OpportunityStage.DISCOVERY]: 0,
        [opportunities_interface_1.OpportunityStage.MOCKUP_STAGE]: 0,
        [opportunities_interface_1.OpportunityStage.INVOICE_SENT]: 0,
        [opportunities_interface_1.OpportunityStage.CLOSED_WON]: 0,
        [opportunities_interface_1.OpportunityStage.CLOSED_LOST]: 0,
    };
}
async function getDashboardMetrics(whereSql = '', params = []) {
    const totalsQuery = `
    SELECT
      COUNT(*)::int AS total_opportunities_count,
      COUNT(*) FILTER (WHERE o.stage = '${opportunities_interface_1.OpportunityStage.CLOSED_WON}')::int AS closed_won_count,
      COUNT(*) FILTER (WHERE o.stage = '${opportunities_interface_1.OpportunityStage.CLOSED_LOST}')::int AS closed_lost_count,
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
    FROM opportunities o
    ${whereSql}
    GROUP BY stage
  `;
    const [totalsResult, stageResult] = await Promise.all([
        database_1.pool.query(totalsQuery, params),
        database_1.pool.query(stageQuery, params),
    ]);
    const totals = totalsResult.rows[0];
    const opportunities_by_stage = emptyStageCounts();
    for (const row of stageResult.rows) {
        const stage = row.stage;
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
async function getOwnerDashboardMetrics() {
    return getDashboardMetrics();
}
async function getDirectorDashboardMetrics(directorId) {
    return getDashboardMetrics('WHERE o.assigned_director_id = $1', [directorId]);
}
async function getRepDashboardMetrics(repId) {
    return getDashboardMetrics('WHERE o.assigned_rep_id = $1', [repId]);
}
//# sourceMappingURL=reporting.service.js.map