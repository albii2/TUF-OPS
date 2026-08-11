"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyActivityRoutes = dailyActivityRoutes;
const daily_activities_controller_1 = require("./daily-activities.controller");
const auth_1 = require("../../auth");
async function dailyActivityRoutes(server) {
    server.post('/', { preHandler: [(0, auth_1.requireCertification)()] }, daily_activities_controller_1.upsertDailyActivityHandler);
    server.get('/today', { preHandler: [(0, auth_1.requireCertification)()] }, daily_activities_controller_1.getTodayActivitiesHandler);
    server.get('/history', { preHandler: [(0, auth_1.requireCertification)()] }, daily_activities_controller_1.getActivityHistoryHandler);
}
//# sourceMappingURL=daily-activities.routes.js.map