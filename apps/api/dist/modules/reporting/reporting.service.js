"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOwnerDashboardMetrics = getOwnerDashboardMetrics;
exports.getDirectorDashboardMetrics = getDirectorDashboardMetrics;
exports.getRepDashboardMetrics = getRepDashboardMetrics;
const database_1 = require("@packages/database");
const opportunities_interface_1 = require("../opportunities/opportunities.interface");
async function getDashboardMetrics(whereClause = '', params = []) {
    const opportunityMetricsQuery = `
    SELECT
        COUNT(*) AS total_opportunities_count,
        COUNT(*) FILTER (WHERE stage = 'CLOSED_WON') AS closed_won_count,
        COUNT(*) FILTER (WHERE stage = 'CLOSED_LOST') AS closed_lost_count,
        COALESCE(SUM(actual_revenue) FILTER (WHERE stage = 'CLOSED_WON'), 0) AS total_actual_revenue,
        COALESCE(SUM(gross_profit) FILTER (WHERE stage = 'CLOSED_WON'), 0) AS total_gross_profit
    FROM
        opportunities
    ${whereClause}
  `;
    const opportunitiesByStageQuery = `
    SELECT
        stage,
        COUNT(*) as count
    FROM
        opportunities
    ${whereClause}
    GROUP BY
        stage
  `;
    const commissionMetricsQuery = `
    SELECT
        COALESCE(SUM(c.rep_commission), 0) AS total_rep_commission,
        COALESCE(SUM(c.director_override), 0) AS total_director_override
    FROM
        commissions c
    JOIN
        opportunities o ON c.opportunity_id = o.id
    ${whereClause.replace('WHERE', 'AND')} 
  `;
    const [opportunityMetricsResult, opportunitiesByStageResult, commissionMetricsResult] = await Promise.all([
        database_1.pool.query(opportunityMetricsQuery, params),
        database_1.pool.query(opportunitiesByStageQuery, params),
        database_1.pool.query(commissionMetricsQuery, params),
    ]);
    const metrics = opportunityMetricsResult.rows[0];
    const commissionMetrics = commissionMetricsResult.rows[0];
    const opportunities_by_stage = Object.values(opportunities_interface_1.OpportunityStage).reduce((acc, stage) => {
        acc[stage] = 0;
        return acc;
    }, {});
    opportunitiesByStageResult.rows.forEach(row => {
        opportunities_by_stage[row.stage] = Number(row.count);
    });
    return {
        total_opportunities_count: Number(metrics.total_opportunities_count),
        opportunities_by_stage,
        closed_won_count: Number(metrics.closed_won_count),
        closed_lost_count: Number(metrics.closed_lost_count),
        total_actual_revenue: parseFloat(metrics.total_actual_revenue),
        total_gross_profit: parseFloat(metrics.total_gross_profit),
        total_rep_commission: parseFloat(commissionMetrics.total_rep_commission),
        total_director_override: parseFloat(commissionMetrics.total_director_override),
    };
}
async function getOwnerDashboardMetrics() {
    return getDashboardMetrics();
}
async function getDirectorDashboardMetrics(directorId) {
    const whereClause = 'WHERE assigned_director_id = $1';
    return getDashboardMetrics(whereClause, [directorId]);
}
async function getRepDashboardMetrics(repId) {
    const whereClause = 'WHERE assigned_rep_id = $1';
    return getDashboardMetrics(whereClause, [repId]);
}
//# sourceMappingURL=reporting.service.js.map