"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExecutiveSummaryHandler = getExecutiveSummaryHandler;
exports.getParticipantsHandler = getParticipantsHandler;
exports.getParticipantDetailHandler = getParticipantDetailHandler;
exports.getRecentActivityHandler = getRecentActivityHandler;
exports.logEventHandler = logEventHandler;
const academy_command_service_1 = require("./academy-command.service");
async function getExecutiveSummaryHandler(request, reply) {
    try {
        const data = await (0, academy_command_service_1.getExecutiveSummary)(request.currentUser);
        return reply.send(data);
    }
    catch (err) {
        if (err.message === 'Authentication required')
            return reply.code(401).send({ error: err.message });
        if (err.message?.includes('Only leadership'))
            return reply.code(403).send({ error: err.message });
        request.log.error(err);
        return reply.code(500).send({ error: 'Failed to fetch executive summary' });
    }
}
async function getParticipantsHandler(request, reply) {
    try {
        const data = await (0, academy_command_service_1.getParticipants)(request.currentUser);
        return reply.send(data);
    }
    catch (err) {
        if (err.message === 'Authentication required')
            return reply.code(401).send({ error: err.message });
        if (err.message?.includes('Only leadership'))
            return reply.code(403).send({ error: err.message });
        request.log.error(err);
        return reply.code(500).send({ error: 'Failed to fetch participants' });
    }
}
async function getParticipantDetailHandler(request, reply) {
    try {
        const { userId } = request.params;
        const data = await (0, academy_command_service_1.getParticipantDetail)(Number(userId), request.currentUser);
        if (!data)
            return reply.code(404).send({ error: 'Participant not found' });
        return reply.send(data);
    }
    catch (err) {
        if (err.message === 'Authentication required')
            return reply.code(401).send({ error: err.message });
        if (err.message?.includes('Only leadership'))
            return reply.code(403).send({ error: err.message });
        request.log.error(err);
        return reply.code(500).send({ error: 'Failed to fetch participant detail' });
    }
}
async function getRecentActivityHandler(request, reply) {
    try {
        const { filter } = request.query;
        const limit = filter === 'all' ? 200 : 50;
        const data = await (0, academy_command_service_1.getRecentActivityFeed)(limit);
        return reply.send(data);
    }
    catch (err) {
        request.log.error(err);
        return reply.code(500).send({ error: 'Failed to fetch recent activity' });
    }
}
async function logEventHandler(request, reply) {
    try {
        const user = request.currentUser;
        if (!user)
            return reply.code(401).send({ error: 'Authentication required' });
        const payload = request.body;
        if (!payload.event_type) {
            return reply.code(400).send({ error: 'event_type is required' });
        }
        await (0, academy_command_service_1.logEvent)(user.id, {
            event_type: payload.event_type,
            entity_type: payload.entity_type,
            entity_id: payload.entity_id,
            metadata: payload.metadata,
        });
        return reply.code(201).send({ ok: true });
    }
    catch (err) {
        request.log.error(err);
        return reply.code(500).send({ error: 'Failed to log event' });
    }
}
//# sourceMappingURL=academy-command.controller.js.map