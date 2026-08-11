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
        // Inject authenticated user as created_by/updated_by if not provided
        const body = request.body;
        if (!body.name?.trim()) {
            return reply.code(400).send({ message: 'Organization name is required' });
        }
        const actorId = request.currentUser?.id;
        console.log('createOrganizationHandler actorId:', actorId, 'hasUser:', !!request.currentUser);
        if (actorId && !body.created_by)
            body.created_by = actorId;
        if (actorId && !body.updated_by)
            body.updated_by = actorId;
        const organization = await (0, organizations_service_1.createOrganization)(body);
        return reply.code(201).send(organization);
    }
    catch (error) {
        if (error.message?.includes('already exists') || error.message?.includes('required')) {
            return reply.code(409).send({ message: error.message });
        }
        console.error('createOrganization error:', error);
        return reply.code(500).send({ message: 'Error creating organization', detail: error?.message || String(error), code: error?.code });
    }
}
async function getOrganizationsHandler(request, reply) {
    const user = request.currentUser;
    const organizations = await (0, organizations_service_1.getOrganizations)();
    // REP users: only see orgs assigned to them
    if (user?.role === 'REP' || user?.role === 'TAE') {
        const filtered = organizations.filter((org) => org.assigned_rep_id === user.id);
        return reply.send(filtered);
    }
    // Territory scoping: directors with a state_market set only see orgs in their state(s)
    if (user?.state_market && user.role !== 'ADMIN') {
        const states = user.state_market.split(',').map((s) => s.trim());
        const filtered = organizations.filter((org) => states.includes(org.state));
        return reply.send(filtered);
    }
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
        console.error('updateOrganization error:', error);
        return reply.code(500).send({ message: error.message || 'Error updating organization' });
    }
}
async function deleteOrganizationHandler(request, reply) {
    const { id } = request.params;
    const userId = request.currentUser?.id ?? null;
    await (0, organizations_service_1.deleteOrganization)(id, userId);
    return reply.code(204).send();
}
//# sourceMappingURL=organizations.controller.js.map