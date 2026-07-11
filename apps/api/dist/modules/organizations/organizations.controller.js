"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrganizationHandler = createOrganizationHandler;
exports.getOrganizationsHandler = getOrganizationsHandler;
exports.getOrganizationByIdHandler = getOrganizationByIdHandler;
exports.updateOrganizationHandler = updateOrganizationHandler;
exports.deleteOrganizationHandler = deleteOrganizationHandler;
const organizations_service_1 = require("./organizations.service");
async function createOrganizationHandler(request, reply) {
    console.log('createOrganizationHandler called with body:', request.body);
    try {
        const organization = await (0, organizations_service_1.createOrganization)(request.body);
        return reply.code(201).send(organization);
    }
    catch (error) {
        if (error.message?.includes('already exists') || error.message?.includes('required')) {
            return reply.code(409).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'Error creating organization' });
    }
}
async function getOrganizationsHandler(request, reply) {
    const organizations = await (0, organizations_service_1.getOrganizations)();
    return reply.send(organizations);
}
async function getOrganizationByIdHandler(request, reply) {
    const { id } = request.params;
    const organization = await (0, organizations_service_1.getOrganizationById)(id);
    if (!organization) {
        return reply.code(404).send({ message: 'Organization not found' });
    }
    return reply.send(organization);
}
async function updateOrganizationHandler(request, reply) {
    const { id } = request.params;
    try {
        const organization = await (0, organizations_service_1.updateOrganization)(id, request.body);
        return reply.send(organization);
    }
    catch (error) {
        if (error.message?.includes('already exists') || error.message?.includes('required')) {
            return reply.code(409).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'Error updating organization' });
    }
}
async function deleteOrganizationHandler(request, reply) {
    const { id } = request.params;
    await (0, organizations_service_1.deleteOrganization)(id);
    return reply.code(204).send();
}
//# sourceMappingURL=organizations.controller.js.map