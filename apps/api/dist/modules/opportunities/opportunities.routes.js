"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.opportunityRoutes = opportunityRoutes;
const opportunities_controller_1 = require("./opportunities.controller");
async function opportunityRoutes(server) {
    server.post('/', opportunities_controller_1.createOpportunityHandler);
    server.get('/organization/:organizationId', opportunities_controller_1.getOpportunitiesByOrganizationHandler);
    server.put('/:id/stage', opportunities_controller_1.updateOpportunityStageHandler);
}
//# sourceMappingURL=opportunities.routes.js.map