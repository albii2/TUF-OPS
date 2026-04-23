"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDirectorDashboardMetrics = getDirectorDashboardMetrics;
exports.getRepDashboardMetrics = getRepDashboardMetrics;
const dummyMetrics = {
    total_opportunities_count: 0,
    opportunities_by_stage: {},
    closed_won_count: 0,
    closed_lost_count: 0,
    total_actual_revenue: 0,
    total_gross_profit: 0,
    total_rep_commission: 0,
    total_director_override: 0,
};
async function getDirectorDashboardMetrics(directorId) {
    console.log(`STUB: Fetching metrics for director ${directorId}`);
    return dummyMetrics;
}
async function getRepDashboardMetrics(repId) {
    console.log(`STUB: Fetching metrics for rep ${repId}`);
    return dummyMetrics;
}
//# sourceMappingURL=reporting.service.js.map