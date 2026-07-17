"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listHandler = listHandler;
exports.getHandler = getHandler;
exports.createHandler = createHandler;
exports.updateHandler = updateHandler;
exports.deleteHandler = deleteHandler;
exports.upcomingHandler = upcomingHandler;
const comms_service_1 = require("./comms.service");
async function listHandler(request, reply) {
    try {
        const { status, recipient } = request.query;
        const items = await (0, comms_service_1.getComms)({ status, recipient });
        return reply.send({ comms: items });
    }
    catch (e) {
        request.log.error(e);
        return reply.code(500).send({ error: 'Failed to fetch comms' });
    }
}
async function getHandler(request, reply) {
    try {
        const { id } = request.params;
        const item = await (0, comms_service_1.getComm)(Number(id));
        if (!item)
            return reply.code(404).send({ error: 'Comm not found' });
        return reply.send(item);
    }
    catch (e) {
        request.log.error(e);
        return reply.code(500).send({ error: 'Failed to fetch comm' });
    }
}
async function createHandler(request, reply) {
    try {
        const body = request.body;
        const user = request.user;
        if (!user?.id)
            return reply.code(401).send({ error: 'Authentication required' });
        const item = await (0, comms_service_1.createComm)({
            subject: body.subject,
            recipient: body.recipient,
            recipient_role: body.recipient_role,
            body: body.body,
            status: body.status,
            scheduled_for: body.scheduled_for,
            tags: body.tags,
            notes: body.notes,
            created_by: user.id,
        });
        return reply.code(201).send(item);
    }
    catch (e) {
        request.log.error(e);
        return reply.code(500).send({ error: 'Failed to create comm' });
    }
}
async function updateHandler(request, reply) {
    try {
        const { id } = request.params;
        const body = request.body;
        const user = request.user;
        if (!user?.id)
            return reply.code(401).send({ error: 'Authentication required' });
        const item = await (0, comms_service_1.updateComm)(Number(id), { ...body, updated_by: user.id });
        if (!item)
            return reply.code(404).send({ error: 'Comm not found' });
        return reply.send(item);
    }
    catch (e) {
        request.log.error(e);
        return reply.code(500).send({ error: 'Failed to update comm' });
    }
}
async function deleteHandler(request, reply) {
    try {
        const { id } = request.params;
        const deleted = await (0, comms_service_1.deleteComm)(Number(id));
        if (!deleted)
            return reply.code(404).send({ error: 'Comm not found' });
        return reply.send({ success: true });
    }
    catch (e) {
        request.log.error(e);
        return reply.code(500).send({ error: 'Failed to delete comm' });
    }
}
async function upcomingHandler(request, reply) {
    try {
        const { hours } = request.query;
        const items = await (0, comms_service_1.getUpcomingComms)(Number(hours) || 24);
        return reply.send({ comms: items });
    }
    catch (e) {
        request.log.error(e);
        return reply.code(500).send({ error: 'Failed to fetch upcoming comms' });
    }
}
//# sourceMappingURL=comms.controller.js.map