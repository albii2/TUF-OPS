"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOwnerDashboardMetricsHandler = getOwnerDashboardMetricsHandler;
exports.getAdminDashboardMetricsHandler = getAdminDashboardMetricsHandler;
exports.getDirectorDashboardMetricsHandler = getDirectorDashboardMetricsHandler;
exports.getRepDashboardMetricsHandler = getRepDashboardMetricsHandler;
exports.getSchoolCoverageMetricsHandler = getSchoolCoverageMetricsHandler;
exports.getCommissionMetricsHandler = getCommissionMetricsHandler;
exports.getDirectorDashboardMetricsByEmailHandler = getDirectorDashboardMetricsByEmailHandler;
exports.getRepDashboardMetricsByEmailHandler = getRepDashboardMetricsByEmailHandler;
const reporting_service_1 = require("./reporting.service");
// TODO(v0.9 auth hardening): these reporting endpoints are intentionally server-owned
// calculations, but this app version still lacks a complete request auth context in
// Fastify. Until auth middleware injects the authenticated actor id/role, do not expose
// id-scoped endpoints outside trusted production routing/API gateway controls.
async function getOwnerDashboardMetricsHandler(_request, reply) {
    const metrics = await (0, reporting_service_1.getOwnerDashboardMetrics)();
    return reply.send(metrics);
}
async function getAdminDashboardMetricsHandler(_request, reply) {
    const metrics = await (0, reporting_service_1.getAdminDashboardMetrics)();
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
async function getSchoolCoverageMetricsHandler(_request, reply) {
    const metrics = await (0, reporting_service_1.getSchoolCoverageMetrics)();
    return reply.send(metrics);
}
async function getCommissionMetricsHandler(_request, reply) {
    const metrics = await (0, reporting_service_1.getCommissionMetrics)();
    return reply.send(metrics);
}
async function getDirectorDashboardMetricsByEmailHandler(request, reply) {
    const { email } = request.query;
    if (!email)
        return reply.code(400).send({ message: 'email query parameter is required' });
    const metrics = await (0, reporting_service_1.getDirectorDashboardMetricsByEmail)(String(email));
    return reply.send(metrics);
}
async function getRepDashboardMetricsByEmailHandler(request, reply) {
    const { email } = request.query;
    if (!email)
        return reply.code(400).send({ message: 'email query parameter is required' });
    const metrics = await (0, reporting_service_1.getRepDashboardMetricsByEmail)(String(email));
    return reply.send(metrics);
}
//# sourceMappingURL=reporting.controller.js.map