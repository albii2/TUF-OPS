"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportingRoutes = reportingRoutes;
const reporting_controller_1 = require("./reporting.controller");
async function reportingRoutes(server) {
    server.get('/owner-dashboard', reporting_controller_1.getOwnerDashboardMetricsHandler);
    server.get('/admin-dashboard', reporting_controller_1.getAdminDashboardMetricsHandler);
    server.get('/director-dashboard-by-email', reporting_controller_1.getDirectorDashboardMetricsByEmailHandler);
    server.get('/rep-dashboard-by-email', reporting_controller_1.getRepDashboardMetricsByEmailHandler);
    server.get('/director-dashboard/:directorId', reporting_controller_1.getDirectorDashboardMetricsHandler);
    server.get('/rep-dashboard/:repId', reporting_controller_1.getRepDashboardMetricsHandler);
    server.get('/school-coverage', reporting_controller_1.getSchoolCoverageMetricsHandler);
    server.get('/commissions', reporting_controller_1.getCommissionMetricsHandler);
}
//# sourceMappingURL=reporting.routes.js.map