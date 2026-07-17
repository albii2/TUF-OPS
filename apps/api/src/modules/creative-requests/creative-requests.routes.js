"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.creativeRequestRoutes = creativeRequestRoutes;
const auth_1 = require("../../auth");
const creative_requests_controller_1 = require("./creative-requests.controller");
async function creativeRequestRoutes(server) {
    server.get('/opportunities/:opportunityId/creative-requests', { preHandler: [(0, auth_1.requireCertification)()] }, creative_requests_controller_1.getOpportunityCreativeRequestsHandler);
    server.post('/opportunities/:opportunityId/creative-requests', { preHandler: [(0, auth_1.requireCertification)()] }, creative_requests_controller_1.createOpportunityCreativeRequestHandler);
    server.patch('/creative-requests/:id', { preHandler: [(0, auth_1.requireCertification)()] }, creative_requests_controller_1.patchCreativeRequestHandler);
}
//# sourceMappingURL=creative-requests.routes.js.map