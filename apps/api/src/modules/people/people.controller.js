"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listHandler = listHandler;
exports.createHandler = createHandler;
exports.advanceHandler = advanceHandler;
exports.statsHandler = statsHandler;
const people_service_1 = require("./people.service");
async function listHandler(request, reply) {
    try {
        const filters = request.query || {};
        const candidates = await (0, people_service_1.getPipelineCandidates)(filters);
        return reply.send({ candidates });
    }
    catch (e) {
        return reply.code(500).send({ error: 'Failed to fetch pipeline' });
    }
}
async function createHandler(request, reply) {
    try {
        const body = request.body;
        if (!body.candidate_name?.trim())
            return reply.code(400).send({ error: 'Name required' });
        const user = request.user;
        const candidate = await (0, people_service_1.createPipelineCandidate)({ ...body, created_by: user?.id || body.created_by });
        return reply.code(201).send({ candidate });
    }
    catch (e) {
        return reply.code(500).send({ error: 'Failed to create' });
    }
}
async function advanceHandler(request, reply) {
    try {
        const { stage, notes } = request.body;
        if (!stage)
            return reply.code(400).send({ error: 'Stage required' });
        const candidate = await (0, people_service_1.advancePipelineStage)(Number(request.params.id), stage, notes);
        return reply.send({ candidate });
    }
    catch (e) {
        return reply.code(500).send({ error: 'Failed to advance' });
    }
}
async function statsHandler(request, reply) {
    try {
        const stats = await (0, people_service_1.getPipelineStats)();
        return reply.send({ stats });
    }
    catch (e) {
        return reply.code(500).send({ error: 'Failed to fetch stats' });
    }
}
//# sourceMappingURL=people.controller.js.map