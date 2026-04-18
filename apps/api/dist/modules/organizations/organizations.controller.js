"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrganizationHandler = createOrganizationHandler;
exports.getOrganizationsHandler = getOrganizationsHandler;
exports.updateOrganizationHandler = updateOrganizationHandler;
exports.deleteOrganizationHandler = deleteOrganizationHandler;
const organizations_service_1 = require("./organizations.service");
async function createOrganizationHandler(request, reply) {
    const organization = await (0, organizations_service_1.createOrganization)(request.body);
    return reply.code(201).send(organization);
}
async function getOrganizationsHandler(request, reply) {
    const organizations = await (0, organizations_service_1.getOrganizations)();
    return reply.send(organizations);
}
async function updateOrganizationHandler(request, reply) {
    const { id } = request.params;
    const organization = await (0, organizations_service_1.updateOrganization)(id, request.body);
    return reply.send(organization);
}
async function deleteOrganizationHandler(request, reply) {
    const { id } = request.params;
    await (0, organizations_service_1.deleteOrganization)(id);
    return reply.code(204).send();
}
//# sourceMappingURL=organizations.controller.js.map