"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listHandler = listHandler;
exports.getHandler = getHandler;
exports.createHandler = createHandler;
exports.updateHandler = updateHandler;
exports.deleteHandler = deleteHandler;
exports.decisionsHandler = decisionsHandler;
exports.lighthouseHandler = lighthouseHandler;
exports.createStatusCheckHandler = createStatusCheckHandler;
exports.getStatusCheckHandler = getStatusCheckHandler;
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
/**
 * Executive Command Center — Lighthouse view
 * Returns scored, classified open items grouped by urgency.
 */
async function lighthouseHandler(request, reply) {
    try {
        // Optionally force recalculate scores if query param ?recalculate=1
        const query = request.query || {};
        if (query.recalculate === '1') {
            const count = await (0, intake_service_1.recalculateAttentionScores)();
            console.log(`Recalculated ${count} attention scores`);
        }
        const view = await (0, intake_service_1.getLighthouseView)();
        return reply.send(view);
    }
    catch (error) {
        console.error('Lighthouse error:', error);
        return reply.code(500).send({ error: 'Failed to load lighthouse view' });
    }
}
/**
 * POST /api/intake/status-check — create a batch of status check items.
 * One intake item per recipient. Each tracks response status.
 */
async function createStatusCheckHandler(request, reply) {
    try {
        const body = request.body;
        if (!body.title?.trim()) {
            return reply.code(400).send({ error: 'Title is required' });
        }
        if (!body.recipients?.length) {
            return reply.code(400).send({ error: 'At least one recipient is required' });
        }
        if (!body.due_date) {
            return reply.code(400).send({ error: 'Due date is required' });
        }
        const user = request.user;
        const result = await (0, intake_service_1.createStatusCheckBatch)({
            title: body.title,
            description: body.description,
            recipients: body.recipients,
            due_date: body.due_date,
            created_by: user?.id || body.created_by || 1,
        });
        return reply.code(201).send(result);
    }
    catch (error) {
        console.error('StatusCheck create error:', error);
        return reply.code(500).send({ error: 'Failed to create status check batch' });
    }
}
/**
 * GET /api/intake/status-check — get response summary.
 * Shows who responded vs who hasn't.
 */
async function getStatusCheckHandler(request, reply) {
    try {
        const summary = await (0, intake_service_1.getStatusCheckSummary)();
        return reply.send(summary);
    }
    catch (error) {
        console.error('StatusCheck get error:', error);
        return reply.code(500).send({ error: 'Failed to get status check summary' });
    }
}
//# sourceMappingURL=intake.controller.js.map