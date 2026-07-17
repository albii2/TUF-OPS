"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executiveDashboardHandler = executiveDashboardHandler;
const dashboard_service_1 = require("./dashboard.service");
async function executiveDashboardHandler(request, reply) {
    try {
        const data = await (0, dashboard_service_1.getExecutiveDashboard)();
        return reply.send(data);
    }
    catch (e) {
        return reply.code(500).send({ error: 'Dashboard query failed' });
    }
}
//# sourceMappingURL=dashboard.controller.js.map