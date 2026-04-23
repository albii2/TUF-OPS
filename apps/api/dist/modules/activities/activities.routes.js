"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityRoutes = activityRoutes;
const activities_controller_1 = require("./activities.controller");
async function activityRoutes(server) {
    server.post('/', activities_controller_1.createActivityHandler);
    server.get('/opportunity/:opportunityId', activities_controller_1.getActivitiesByOpportunityHandler);
    server.get('/organization/:organizationId', activities_controller_1.getActivitiesByOrganizationHandler);
    server.put('/:id/complete', activities_controller_1.markActivityCompleteHandler);
}
//# sourceMappingURL=activities.routes.js.map