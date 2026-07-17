"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationRoutes = organizationRoutes;
const auth_1 = require("../../auth");
const organizations_controller_1 = require("./organizations.controller");
async function organizationRoutes(server) {
    server.post('/', { preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.CREATE_ORGANIZATION)] }, organizations_controller_1.createOrganizationHandler);
    server.get('/', { preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.VIEW_ORGANIZATION_OWN)] }, organizations_controller_1.getOrganizationsHandler);
    server.get('/:id', { preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.VIEW_ORGANIZATION_OWN)] }, organizations_controller_1.getOrganizationByIdHandler);
    server.put('/:id', { preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.EDIT_ORGANIZATION_OWN)] }, organizations_controller_1.updateOrganizationHandler);
    server.delete('/:id', { preHandler: [(0, auth_1.requireCertification)(), (0, auth_1.requirePermission)(auth_1.permissions.CONFIGURE_TERRITORY)] }, organizations_controller_1.deleteOrganizationHandler);
}
//# sourceMappingURL=organizations.routes.js.map