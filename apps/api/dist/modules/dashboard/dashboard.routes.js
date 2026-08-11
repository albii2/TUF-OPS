"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoutes = dashboardRoutes;
const dashboard_controller_1 = require("./dashboard.controller");
async function dashboardRoutes(server) {
    server.get('/', dashboard_controller_1.executiveDashboardHandler);
}
//# sourceMappingURL=dashboard.routes.js.map