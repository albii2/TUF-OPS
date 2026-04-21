"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationRoutes = organizationRoutes;
const organizations_controller_1 = require("./organizations.controller");
async function organizationRoutes(server) {
    server.post('/', organizations_controller_1.createOrganizationHandler);
    server.get('/', organizations_controller_1.getOrganizationsHandler);
    server.put('/:id', organizations_controller_1.updateOrganizationHandler);
    server.delete('/:id', organizations_controller_1.deleteOrganizationHandler);
}
//# sourceMappingURL=organizations.routes.js.map