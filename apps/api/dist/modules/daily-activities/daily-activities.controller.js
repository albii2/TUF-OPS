"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertDailyActivityHandler = upsertDailyActivityHandler;
exports.getTodayActivitiesHandler = getTodayActivitiesHandler;
exports.getActivityHistoryHandler = getActivityHistoryHandler;
const daily_activities_service_1 = require("./daily-activities.service");
async function upsertDailyActivityHandler(request, reply) {
    if (!request.currentUser) {
        return reply.code(401).send({ error: 'Authentication required' });
    }
    const body = request.body;
    try {
        const activity = await (0, daily_activities_service_1.upsertDailyActivity)(request.currentUser.id, request.body);
        return reply.code(200).send(activity);
    }
    catch (error) {
        return reply.code(500).send({ error: error?.message || 'Failed to save activity' });
    }
}
async function getTodayActivitiesHandler(request, reply) {
    if (!request.currentUser) {
        return reply.code(401).send({ error: 'Authentication required' });
    }
    try {
        const activities = await (0, daily_activities_service_1.getTodayActivities)(request.currentUser.id, request.currentUser.role);
        return reply.send({ activities, date: new Date().toISOString().slice(0, 10) });
    }
    catch (error) {
        return reply.code(500).send({ error: error?.message || 'Failed to get activities' });
    }
}
async function getActivityHistoryHandler(request, reply) {
    if (!request.currentUser) {
        return reply.code(401).send({ error: 'Authentication required' });
    }
    try {
        const { days } = request.query;
        const history = await (0, daily_activities_service_1.getActivityHistory)(request.currentUser.id, Number(days) || 7);
        return reply.send({ history });
    }
    catch (error) {
        return reply.code(500).send({ error: error?.message || 'Failed to get history' });
    }
}
//# sourceMappingURL=daily-activities.controller.js.map