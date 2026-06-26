"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityRoutes = activityRoutes;
const activities_controller_1 = require("./activities.controller");
const auth_1 = require("../../auth");
async function activityRoutes(server) {
    server.post('/', { preHandler: [(0, auth_1.requireCertification)()] }, activities_controller_1.createActivityHandler);
    server.get('/opportunity/:opportunityId', { preHandler: [(0, auth_1.requireCertification)()] }, activities_controller_1.getActivitiesByOpportunityHandler);
    server.get('/organization/:organizationId', { preHandler: [(0, auth_1.requireCertification)()] }, activities_controller_1.getActivitiesByOrganizationHandler);
    server.put('/:id/complete', { preHandler: [(0, auth_1.requireCertification)()] }, activities_controller_1.markActivityCompleteHandler);
    // RepActivity (prospecting) endpoints — protected by LOG_RELATIONSHIP_ACTIVITY
    server.post('/rep', {
        preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.LOG_RELATIONSHIP_ACTIVITY)],
    }, activities_controller_1.createRepActivityHandler);
    server.get('/rep', {
        preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.LOG_RELATIONSHIP_ACTIVITY)],
    }, activities_controller_1.getRepActivitiesByOpportunityHandler);
}
//# sourceMappingURL=activities.routes.js.map