"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.opportunityRoutes = opportunityRoutes;
const opportunities_controller_1 = require("./opportunities.controller");
async function opportunityRoutes(server) {
    server.get('/', opportunities_controller_1.getOpportunitiesHandler);
    server.post('/', opportunities_controller_1.createOpportunityHandler);
    server.get('/organization/:organizationId', opportunities_controller_1.getOpportunitiesByOrganizationHandler);
    server.put('/:id/stage', opportunities_controller_1.updateOpportunityStageHandler);
    server.put('/:id', opportunities_controller_1.updateOpportunityHandler);
}
//# sourceMappingURL=opportunities.routes.js.map