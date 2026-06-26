"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createActivityHandler = createActivityHandler;
exports.getActivitiesByOpportunityHandler = getActivitiesByOpportunityHandler;
exports.getActivitiesByOrganizationHandler = getActivitiesByOrganizationHandler;
exports.markActivityCompleteHandler = markActivityCompleteHandler;
exports.createRepActivityHandler = createRepActivityHandler;
exports.getRepActivitiesByOpportunityHandler = getRepActivitiesByOpportunityHandler;
const activities_service_1 = require("./activities.service");
const activities_interface_1 = require("./activities.interface");
async function createActivityHandler(request, reply) {
    const { type, organization_id, opportunity_id, description, created_by, due_date, completed } = request.body;
    if (!Object.values(activities_interface_1.ActivityType).includes(type)) {
        return reply.code(400).send({ message: 'Invalid activity type' });
    }
    const activity = await (0, activities_service_1.createActivity)({ type, organization_id, opportunity_id, description, created_by, due_date, completed });
    return reply.code(201).send(activity);
}
async function getActivitiesByOpportunityHandler(request, reply) {
    const { opportunityId } = request.params;
    const activities = await (0, activities_service_1.getActivitiesByOpportunity)(Number(opportunityId));
    return reply.send(activities);
}
async function getActivitiesByOrganizationHandler(request, reply) {
    const { organizationId } = request.params;
    const activities = await (0, activities_service_1.getActivitiesByOrganization)(Number(organizationId));
    return reply.send(activities);
}
async function markActivityCompleteHandler(request, reply) {
    const { id } = request.params;
    const { completedBy } = request.body; // Assuming completedBy is passed in body
    try {
        const updatedActivity = await (0, activities_service_1.markActivityComplete)(Number(id), completedBy);
        return reply.send(updatedActivity);
    }
    catch (error) {
        if (error.message.includes('not found')) {
            return reply.code(404).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
// RepActivity handlers (prospecting activity logging)
async function createRepActivityHandler(request, reply) {
    const currentUser = request.currentUser;
    if (!currentUser?.id) {
        return reply.code(401).send({ message: 'Authentication required' });
    }
    const { opportunity_id, activity_type, notes } = request.body;
    try {
        const activity = await (0, activities_service_1.createRepActivity)({
            user_id: currentUser.id,
            opportunity_id,
            activity_type,
            notes,
        });
        return reply.code(201).send(activity);
    }
    catch (error) {
        if (error.message.includes('Invalid activity_type')) {
            return reply.code(400).send({ message: error.message });
        }
        if (error.message.includes('required')) {
            return reply.code(400).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function getRepActivitiesByOpportunityHandler(request, reply) {
    const { opportunity_id } = request.query;
    if (!opportunity_id) {
        return reply.code(400).send({ message: 'opportunity_id query parameter is required' });
    }
    const activities = await (0, activities_service_1.getRepActivitiesByOpportunity)(Number(opportunity_id));
    return reply.send(activities);
}
//# sourceMappingURL=activities.controller.js.map