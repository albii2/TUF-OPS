"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listWorkItemsHandler = listWorkItemsHandler;
exports.createWorkItemHandler = createWorkItemHandler;
exports.updateWorkItemHandler = updateWorkItemHandler;
exports.updateWorkItemStatusHandler = updateWorkItemStatusHandler;
const work_items_service_1 = require("./work-items.service");
async function listWorkItemsHandler(request, reply) {
    try {
        const { owner_id, status, source, priority, linked_entity_type, linked_entity_id } = request.query;
        const items = await (0, work_items_service_1.listWorkItems)({
            owner_id: owner_id !== undefined ? Number(owner_id) : undefined,
            status,
            source,
            priority,
            linked_entity_type,
            linked_entity_id: linked_entity_id !== undefined ? Number(linked_entity_id) : undefined,
        });
        return reply.send(items);
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: error?.message || 'Failed to list work items' });
    }
}
async function createWorkItemHandler(request, reply) {
    try {
        const input = request.body;
        if (!input.source?.trim() || !input.item_type?.trim() || !input.title?.trim()) {
            return reply.code(400).send({ error: 'source, item_type, and title are required' });
        }
        const item = await (0, work_items_service_1.createWorkItem)(input);
        return reply.code(201).send(item);
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: error?.message || 'Failed to create work item' });
    }
}
async function updateWorkItemHandler(request, reply) {
    try {
        const { id } = request.params;
        const input = request.body;
        const item = await (0, work_items_service_1.updateWorkItem)(Number(id), input);
        if (!item)
            return reply.code(404).send({ error: 'Work item not found' });
        return reply.send(item);
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: error?.message || 'Failed to update work item' });
    }
}
async function updateWorkItemStatusHandler(request, reply) {
    try {
        const { id } = request.params;
        const input = request.body;
        if (!input.status?.trim()) {
            return reply.code(400).send({ error: 'status is required' });
        }
        const item = await (0, work_items_service_1.updateWorkItemStatus)(Number(id), input);
        if (!item)
            return reply.code(404).send({ error: 'Work item not found' });
        return reply.send(item);
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: error?.message || 'Failed to update work item status' });
    }
}
//# sourceMappingURL=work-items.controller.js.map