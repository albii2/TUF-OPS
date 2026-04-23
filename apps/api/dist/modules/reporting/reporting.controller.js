"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOwnerDashboardMetricsHandler = getOwnerDashboardMetricsHandler;
exports.getDirectorDashboardMetricsHandler = getDirectorDashboardMetricsHandler;
exports.getRepDashboardMetricsHandler = getRepDashboardMetricsHandler;
const owner_dashboard_service_1 = require("./owner_dashboard.service");
const reporting_service_1 = require("./reporting.service");
async function getOwnerDashboardMetricsHandler(request, reply) {
    const metrics = await (0, owner_dashboard_service_1.getOwnerDashboardData)();
    return reply.send(metrics);
}
async function getDirectorDashboardMetricsHandler(request, reply) {
    const { directorId } = request.params;
    const metrics = await (0, reporting_service_1.getDirectorDashboardMetrics)(Number(directorId));
    return reply.send(metrics);
}
async function getRepDashboardMetricsHandler(request, reply) {
    const { repId } = request.params;
    const metrics = await (0, reporting_service_1.getRepDashboardMetrics)(Number(repId));
    return reply.send(metrics);
}
//# sourceMappingURL=reporting.controller.js.map