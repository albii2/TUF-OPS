"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productionRequestRoutes = productionRequestRoutes;
const production_requests_controller_1 = require("./production-requests.controller");
async function productionRequestRoutes(server) {
    server.post('/', production_requests_controller_1.createProductionRequestHandler);
    server.put('/:id/status', production_requests_controller_1.updateProductionRequestStatusHandler);
    server.get('/opportunity/:opportunityId', production_requests_controller_1.getProductionRequestsByOpportunityHandler);
}
//# sourceMappingURL=production-requests.routes.js.map