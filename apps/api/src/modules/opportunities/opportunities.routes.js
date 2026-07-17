"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.opportunityRoutes = opportunityRoutes;
const auth_1 = require("../../auth");
const opportunities_controller_1 = require("./opportunities.controller");
async function opportunityRoutes(server) {
    server.get('/', { preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.VIEW_OPPORTUNITY_OWN)] }, opportunities_controller_1.getOpportunitiesHandler);
    server.post('/', { preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.CREATE_OPPORTUNITY)] }, opportunities_controller_1.createOpportunityHandler);
    server.get('/:id', { preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.VIEW_OPPORTUNITY_OWN)] }, opportunities_controller_1.getOpportunityByIdHandler);
    server.get('/organization/:organizationId', { preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.VIEW_OPPORTUNITY_OWN)] }, opportunities_controller_1.getOpportunitiesByOrganizationHandler);
    // Stage advancement: TAE cannot advance beyond Closed Won.
    // The stage-aware preHandler checks the opportunity's current stage
    // and blocks TAE from advancing from Closed Won or later.
    server.put('/:id/stage', { preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requireStageAwareAdvancePermission)(auth_1.permissions.ADVANCE_STAGE_PRE_CW)] }, opportunities_controller_1.updateOpportunityStageHandler);
    // Opportunity edit: TAE loses edit access to order fields after Closed Won
    // but retains relationship field access at all stages.
    server.put('/:id', { preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requireStageAwareEditPermission)(auth_1.permissions.EDIT_OPPORTUNITY_PRE_CW)] }, opportunities_controller_1.updateOpportunityHandler);
}
//# sourceMappingURL=opportunities.routes.js.map