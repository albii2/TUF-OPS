"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOpportunityHandler = createOpportunityHandler;
exports.getOpportunitiesByOrganizationHandler = getOpportunitiesByOrganizationHandler;
exports.updateOpportunityStageHandler = updateOpportunityStageHandler;
const opportunities_service_1 = require("./opportunities.service");
async function createOpportunityHandler(request, reply) {
    const opportunity = await (0, opportunities_service_1.createOpportunity)(request.body);
    return reply.code(201).send(opportunity);
}
async function getOpportunitiesByOrganizationHandler(request, reply) {
    const { organizationId } = request.params;
    const opportunities = await (0, opportunities_service_1.getOpportunitiesByOrganization)(organizationId);
    return reply.send(opportunities);
}
async function updateOpportunityStageHandler(request, reply) {
    const { id } = request.params;
    const { toStage, changedBy, note, actual_revenue, actual_cost, loss_reason } = request.body;
    try {
        const updatedOpportunity = await (0, opportunities_service_1.updateOpportunityStage)(Number(id), toStage, changedBy, note, { actual_revenue, actual_cost, loss_reason });
        return reply.send(updatedOpportunity);
    }
    catch (error) {
        if (error.message.includes('not found')) {
            return reply.code(404).send({ message: error.message });
        }
        if (error.message.includes('Invalid stage transition') || error.message.includes('required to close an opportunity')) {
            return reply.code(400).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
//# sourceMappingURL=opportunities.controller.js.map