"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOpportunityHandler = createOpportunityHandler;
exports.getOpportunitiesByOrganizationHandler = getOpportunitiesByOrganizationHandler;
exports.getOpportunitiesHandler = getOpportunitiesHandler;
exports.updateOpportunityStageHandler = updateOpportunityStageHandler;
exports.updateOpportunityHandler = updateOpportunityHandler;
const opportunities_service_1 = require("./opportunities.service");
async function createOpportunityHandler(request, reply) {
    try {
        const opportunity = await (0, opportunities_service_1.createOpportunity)(request.body);
        return reply.code(201).send(opportunity);
    }
    catch (error) {
        if (error.message.includes('already exists') || error.message.includes('channel_type is required')) {
            return reply.code(400).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function getOpportunitiesByOrganizationHandler(request, reply) {
    const { organizationId } = request.params;
    const opportunities = await (0, opportunities_service_1.getOpportunitiesByOrganization)(organizationId);
    return reply.send(opportunities);
}
async function getOpportunitiesHandler(request, reply) {
    const opportunities = await (0, opportunities_service_1.getOpportunities)();
    return reply.send(opportunities);
}
async function updateOpportunityStageHandler(request, reply) {
    const { id } = request.params;
    const { stage, changed_by, note, actual_revenue, actual_cost, loss_reason } = request.body;
    try {
        const updatedOpportunity = await (0, opportunities_service_1.updateOpportunityStage)(Number(id), stage, changed_by, note, { actual_revenue, actual_cost, loss_reason });
        return reply.send(updatedOpportunity);
    }
    catch (error) {
        if (error.message.includes('not found')) {
            return reply.code(404).send({ message: error.message });
        }
        if (error.message.includes('Invalid stage transition') || error.message.includes('required to close an opportunity') || error.message.includes('cannot be negative')) {
            return reply.code(400).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function updateOpportunityHandler(request, reply) {
    const { id } = request.params;
    try {
        const updatedOpportunity = await (0, opportunities_service_1.updateOpportunity)(Number(id), request.body);
        return reply.send(updatedOpportunity);
    }
    catch (error) {
        if (error.message.includes('not found')) {
            return reply.code(404).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
//# sourceMappingURL=opportunities.controller.js.map