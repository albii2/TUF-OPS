"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listHandler = listHandler;
exports.getHandler = getHandler;
exports.createHandler = createHandler;
exports.updateHandler = updateHandler;
exports.deleteHandler = deleteHandler;
exports.decisionsHandler = decisionsHandler;
const intake_service_1 = require("./intake.service");
async function listHandler(request, reply) {
    try {
        const filters = request.query || {};
        const items = await (0, intake_service_1.getIntakeItems)(filters);
        return reply.send({ items });
    }
    catch (error) {
        return reply.code(500).send({ error: 'Failed to fetch intake items' });
    }
}
async function getHandler(request, reply) {
    try {
        const item = await (0, intake_service_1.getIntakeItem)(Number(request.params.id));
        if (!item)
            return reply.code(404).send({ error: 'Not found' });
        return reply.send({ item });
    }
    catch (error) {
        return reply.code(500).send({ error: 'Failed to fetch item' });
    }
}
async function createHandler(request, reply) {
    try {
        const body = request.body;
        if (!body.title?.trim()) {
            return reply.code(400).send({ error: 'Title is required' });
        }
        const user = request.user;
        const item = await (0, intake_service_1.createIntakeItem)({
            ...body,
            created_by: user?.id || body.created_by,
        });
        return reply.code(201).send({ item });
    }
    catch (error) {
        return reply.code(500).send({ error: 'Failed to create item' });
    }
}
async function updateHandler(request, reply) {
    try {
        const body = request.body;
        const user = request.user;
        const item = await (0, intake_service_1.updateIntakeItem)(Number(request.params.id), {
            ...body,
            updated_by: user?.id || body.updated_by,
        });
        if (!item)
            return reply.code(404).send({ error: 'Not found' });
        return reply.send({ item });
    }
    catch (error) {
        return reply.code(500).send({ error: 'Failed to update item' });
    }
}
async function deleteHandler(request, reply) {
    try {
        const deleted = await (0, intake_service_1.deleteIntakeItem)(Number(request.params.id));
        if (!deleted)
            return reply.code(404).send({ error: 'Not found' });
        return reply.send({ success: true });
    }
    catch (error) {
        return reply.code(500).send({ error: 'Failed to delete item' });
    }
}
async function decisionsHandler(request, reply) {
    try {
        const items = await (0, intake_service_1.getOpenDecisions)();
        return reply.send({ items });
    }
    catch (error) {
        return reply.code(500).send({ error: 'Failed to fetch decisions' });
    }
}
//# sourceMappingURL=intake.controller.js.map