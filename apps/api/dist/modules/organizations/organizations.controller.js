"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrganizationHandler = createOrganizationHandler;
exports.getOrganizationsHandler = getOrganizationsHandler;
const organizations_service_1 = require("./organizations.service");
async function createOrganizationHandler(request, reply) {
    const organization = await (0, organizations_service_1.createOrganization)(request.body);
    return reply.code(201).send(organization);
}
async function getOrganizationsHandler(request, reply) {
    const organizations = await (0, organizations_service_1.getOrganizations)();
    return reply.send(organizations);
}
//# sourceMappingURL=organizations.controller.js.map