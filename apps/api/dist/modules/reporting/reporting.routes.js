"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportingRoutes = reportingRoutes;
const reporting_controller_1 = require("./reporting.controller");
async function reportingRoutes(server) {
    server.get('/owner-dashboard', reporting_controller_1.getOwnerDashboardMetricsHandler);
    server.get('/director-dashboard/:directorId', reporting_controller_1.getDirectorDashboardMetricsHandler);
    server.get('/rep-dashboard/:repId', reporting_controller_1.getRepDashboardMetricsHandler);
}
//# sourceMappingURL=reporting.routes.js.map