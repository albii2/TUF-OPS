"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportingRoutes = reportingRoutes;
const auth_1 = require("../../auth");
const reporting_controller_1 = require("./reporting.controller");
async function reportingRoutes(server) {
    server.get('/owner-dashboard', { preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.VIEW_TERRITORY_HEALTH)] }, reporting_controller_1.getOwnerDashboardMetricsHandler);
    server.get('/admin-dashboard', { preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.VIEW_TERRITORY_HEALTH)] }, reporting_controller_1.getAdminDashboardMetricsHandler);
    server.get('/director-dashboard-by-email', { preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.VIEW_TEAM_PIPELINE)] }, reporting_controller_1.getDirectorDashboardMetricsByEmailHandler);
    server.get('/rep-dashboard-by-email', { preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.VIEW_PERSONAL_PIPELINE)] }, reporting_controller_1.getRepDashboardMetricsByEmailHandler);
    server.get('/director-dashboard/:directorId', { preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.VIEW_TEAM_PIPELINE)] }, reporting_controller_1.getDirectorDashboardMetricsHandler);
    server.get('/rep-dashboard/:repId', { preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.VIEW_PERSONAL_PIPELINE)] }, reporting_controller_1.getRepDashboardMetricsHandler);
    server.get('/school-coverage', { preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.VIEW_TERRITORY_HEALTH)] }, reporting_controller_1.getSchoolCoverageMetricsHandler);
    server.get('/commissions', { preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.VIEW_PERSONAL_PIPELINE)] }, reporting_controller_1.getCommissionMetricsHandler);
}
//# sourceMappingURL=reporting.routes.js.map