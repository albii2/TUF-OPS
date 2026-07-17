"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productionRequestRoutes = productionRequestRoutes;
const auth_1 = require("../../auth");
const production_requests_controller_1 = require("./production-requests.controller");
async function productionRequestRoutes(server) {
    server.post('/', { preHandler: [(0, auth_1.requireCertification)()] }, production_requests_controller_1.createProductionRequestHandler);
    server.put('/:id/status', { preHandler: [(0, auth_1.requireCertification)()] }, production_requests_controller_1.updateProductionRequestStatusHandler);
    server.get('/opportunity/:opportunityId', { preHandler: [(0, auth_1.requireCertification)()] }, production_requests_controller_1.getProductionRequestsByOpportunityHandler);
}
//# sourceMappingURL=production-requests.routes.js.map