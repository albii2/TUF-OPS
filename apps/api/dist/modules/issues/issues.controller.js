"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listIssuesHandler = listIssuesHandler;
exports.getIssueHandler = getIssueHandler;
exports.createIssueHandler = createIssueHandler;
exports.updateIssueHandler = updateIssueHandler;
exports.updateIssueStatusHandler = updateIssueStatusHandler;
const issues_service_1 = require("./issues.service");
async function listIssuesHandler(request, reply) {
    try {
        const { status, severity, category, submitted_by, assigned_to, is_blocking } = request.query;
        const items = await (0, issues_service_1.listIssues)({
            status: status,
            severity: severity,
            category: category,
            submitted_by: submitted_by !== undefined ? Number(submitted_by) : undefined,
            assigned_to: assigned_to !== undefined ? Number(assigned_to) : undefined,
            is_blocking: is_blocking !== undefined ? is_blocking === 'true' : undefined,
        });
        return reply.send({ items });
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: error?.message || 'Failed to list issues' });
    }
}
async function getIssueHandler(request, reply) {
    try {
        const item = await (0, issues_service_1.getIssueById)(Number(request.params.id));
        if (!item)
            return reply.code(404).send({ error: 'Issue not found' });
        return reply.send({ item });
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: error?.message || 'Failed to fetch issue' });
    }
}
async function createIssueHandler(request, reply) {
    try {
        const input = request.body;
        if (!input.title?.trim()) {
            return reply.code(400).send({ error: 'Title is required' });
        }
        const user = request.currentUser;
        if (!user?.id) {
            return reply.code(401).send({ error: 'Authentication required' });
        }
        const item = await (0, issues_service_1.createIssue)(input, user.id);
        return reply.code(201).send({ item });
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: error?.message || 'Failed to create issue' });
    }
}
async function updateIssueHandler(request, reply) {
    try {
        const input = request.body;
        const item = await (0, issues_service_1.updateIssue)(Number(request.params.id), input);
        if (!item)
            return reply.code(404).send({ error: 'Issue not found' });
        return reply.send({ item });
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: error?.message || 'Failed to update issue' });
    }
}
async function updateIssueStatusHandler(request, reply) {
    try {
        const input = request.body;
        if (!input.status?.trim()) {
            return reply.code(400).send({ error: 'Status is required' });
        }
        const item = await (0, issues_service_1.updateIssueStatus)(Number(request.params.id), input);
        if (!item)
            return reply.code(404).send({ error: 'Issue not found' });
        return reply.send({ item });
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: error?.message || 'Failed to update issue status' });
    }
}
//# sourceMappingURL=issues.controller.js.map