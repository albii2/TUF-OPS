"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpportunityCreativeRequestsHandler = getOpportunityCreativeRequestsHandler;
exports.createOpportunityCreativeRequestHandler = createOpportunityCreativeRequestHandler;
exports.patchCreativeRequestHandler = patchCreativeRequestHandler;
const creative_requests_service_1 = require("./creative-requests.service");
async function getOpportunityCreativeRequestsHandler(request, reply) {
    const { opportunityId } = request.params;
    return reply.send(await (0, creative_requests_service_1.listCreativeRequestsByOpportunity)(Number(opportunityId)));
}
async function createOpportunityCreativeRequestHandler(request, reply) {
    try {
        const { opportunityId } = request.params;
        return reply.code(201).send(await (0, creative_requests_service_1.createCreativeRequest)(Number(opportunityId), request.body));
    }
    catch (error) {
        return reply.code(400).send({ message: error.message || 'Unable to create creative request' });
    }
}
async function patchCreativeRequestHandler(request, reply) {
    try {
        const { id } = request.params;
        return reply.send(await (0, creative_requests_service_1.updateCreativeRequest)(Number(id), request.body));
    }
    catch (error) {
        return reply.code(error.message.includes('not found') ? 404 : 400).send({ message: error.message });
    }
}
//# sourceMappingURL=creative-requests.controller.js.map