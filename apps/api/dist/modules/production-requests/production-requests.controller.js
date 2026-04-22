"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductionRequestHandler = createProductionRequestHandler;
exports.updateProductionRequestStatusHandler = updateProductionRequestStatusHandler;
exports.getProductionRequestsByOpportunityHandler = getProductionRequestsByOpportunityHandler;
const production_requests_service_1 = require("./production-requests.service");
async function createProductionRequestHandler(request, reply) {
    try {
        const productionRequest = await (0, production_requests_service_1.createProductionRequest)(request.body);
        reply.code(201).send(productionRequest);
    }
    catch (error) {
        reply.code(400).send({ error: error.message });
    }
}
async function updateProductionRequestStatusHandler(request, reply) {
    try {
        const { id } = request.params;
        const { status } = request.body;
        const productionRequest = await (0, production_requests_service_1.updateProductionRequestStatus)(id, status);
        reply.send(productionRequest);
    }
    catch (error) {
        reply.code(400).send({ error: error.message });
    }
}
async function getProductionRequestsByOpportunityHandler(request, reply) {
    try {
        const { opportunityId } = request.params;
        const productionRequests = await (0, production_requests_service_1.getProductionRequestsByOpportunity)(opportunityId);
        reply.send(productionRequests);
    }
    catch (error) {
        reply.code(400).send({ error: error.message });
    }
}
//# sourceMappingURL=production-requests.controller.js.map