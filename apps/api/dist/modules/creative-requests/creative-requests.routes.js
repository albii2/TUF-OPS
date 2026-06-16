"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.creativeRequestRoutes = creativeRequestRoutes;
const creative_requests_controller_1 = require("./creative-requests.controller");
async function creativeRequestRoutes(server) {
    server.get('/opportunities/:opportunityId/creative-requests', creative_requests_controller_1.getOpportunityCreativeRequestsHandler);
    server.post('/opportunities/:opportunityId/creative-requests', creative_requests_controller_1.createOpportunityCreativeRequestHandler);
    server.patch('/creative-requests/:id', creative_requests_controller_1.patchCreativeRequestHandler);
}
//# sourceMappingURL=creative-requests.routes.js.map