"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProgressHandler = getProgressHandler;
exports.updatePhaseHandler = updatePhaseHandler;
exports.getMissionsHandler = getMissionsHandler;
exports.startMissionHandler = startMissionHandler;
exports.submitMissionHandler = submitMissionHandler;
exports.getMissionsWithReviewsHandler = getMissionsWithReviewsHandler;
exports.createReviewHandler = createReviewHandler;
exports.getPendingReviewsHandler = getPendingReviewsHandler;
exports.getGraduationCheckHandler = getGraduationCheckHandler;
exports.approveTerritoryHandler = approveTerritoryHandler;
exports.syncChecklistHandler = syncChecklistHandler;
const academy_service_1 = require("./academy.service");
const academy_interface_1 = require("./academy.interface");
// ─── Progress ──────────────────────────────────────────────────────
async function getProgressHandler(request, reply) {
    try {
        const { userId } = request.query;
        if (!userId)
            return reply.code(400).send({ message: 'userId is required' });
        const numericId = Number(userId);
        if (isNaN(numericId))
            return reply.code(400).send({ message: 'Invalid userId' });
        const progress = await (0, academy_service_1.getFullProgress)(numericId);
        return reply.send(progress);
    }
    catch (error) {
        console.error('[academy:getProgress]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function updatePhaseHandler(request, reply) {
    try {
        const { userId, phase, completed } = request.body;
        if (!userId || !phase || completed === undefined) {
            return reply.code(400).send({ message: 'userId, phase, and completed are required' });
        }
        const validPhases = Object.values(academy_interface_1.AcademyPhase);
        if (!validPhases.includes(phase)) {
            return reply.code(400).send({ message: `Invalid phase. Must be one of: ${validPhases.join(', ')}` });
        }
        const numericId = Number(userId);
        if (isNaN(numericId))
            return reply.code(400).send({ message: 'Invalid userId' });
        const result = await (0, academy_service_1.updatePhaseCompletion)(numericId, phase, !!completed);
        return reply.send(result);
    }
    catch (error) {
        console.error('[academy:updatePhase]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
// ─── Missions ──────────────────────────────────────────────────────
async function getMissionsHandler(request, reply) {
    try {
        const { userId } = request.query;
        if (!userId)
            return reply.code(400).send({ message: 'userId is required' });
        const numericId = Number(userId);
        if (isNaN(numericId))
            return reply.code(400).send({ message: 'Invalid userId' });
        const missions = await (0, academy_service_1.getOrCreateMissions)(numericId);
        return reply.send(missions);
    }
    catch (error) {
        console.error('[academy:getMissions]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function startMissionHandler(request, reply) {
    try {
        const { userId, missionNumber } = request.body;
        if (!userId || !missionNumber) {
            return reply.code(400).send({ message: 'userId and missionNumber are required' });
        }
        const numericId = Number(userId);
        const missionNum = Number(missionNumber);
        if (isNaN(numericId) || isNaN(missionNum)) {
            return reply.code(400).send({ message: 'Invalid userId or missionNumber' });
        }
        const mission = await (0, academy_service_1.startMission)(numericId, missionNum);
        return reply.send(mission);
    }
    catch (error) {
        console.error('[academy:startMission]', error.message);
        if (error.message.includes('not available')) {
            return reply.code(400).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function submitMissionHandler(request, reply) {
    try {
        const { userId, missionNumber } = request.body;
        if (!userId || !missionNumber) {
            return reply.code(400).send({ message: 'userId and missionNumber are required' });
        }
        const numericId = Number(userId);
        const missionNum = Number(missionNumber);
        if (isNaN(numericId) || isNaN(missionNum)) {
            return reply.code(400).send({ message: 'Invalid userId or missionNumber' });
        }
        const mission = await (0, academy_service_1.submitMission)(numericId, missionNum);
        return reply.send(mission);
    }
    catch (error) {
        console.error('[academy:submitMission]', error.message);
        if (error.message.includes('not in progress')) {
            return reply.code(400).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function getMissionsWithReviewsHandler(request, reply) {
    try {
        const { userId } = request.query;
        if (!userId)
            return reply.code(400).send({ message: 'userId is required' });
        const numericId = Number(userId);
        if (isNaN(numericId))
            return reply.code(400).send({ message: 'Invalid userId' });
        const missions = await (0, academy_service_1.getMissionsWithReviews)(numericId);
        return reply.send(missions);
    }
    catch (error) {
        console.error('[academy:getMissionsWithReviews]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
// ─── Director Reviews ──────────────────────────────────────────────
async function createReviewHandler(request, reply) {
    try {
        const { missionId, reviewerId, status, strengths, corrections, coachingNotes } = request.body;
        if (!missionId || !reviewerId || !status) {
            return reply.code(400).send({ message: 'missionId, reviewerId, and status are required' });
        }
        if (!Object.values(academy_interface_1.DirectorReviewStatus).includes(status)) {
            return reply.code(400).send({ message: `Invalid status. Must be one of: ${Object.values(academy_interface_1.DirectorReviewStatus).join(', ')}` });
        }
        const review = await (0, academy_service_1.createReview)(Number(missionId), Number(reviewerId), status, strengths || '', corrections || '', coachingNotes || '');
        return reply.code(201).send(review);
    }
    catch (error) {
        console.error('[academy:createReview]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function getPendingReviewsHandler(request, reply) {
    try {
        const pending = await (0, academy_service_1.getPendingReviews)();
        return reply.send(pending);
    }
    catch (error) {
        console.error('[academy:getPendingReviews]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
// ─── Graduation ────────────────────────────────────────────────────
async function getGraduationCheckHandler(request, reply) {
    try {
        const { userId } = request.query;
        if (!userId)
            return reply.code(400).send({ message: 'userId is required' });
        const numericId = Number(userId);
        if (isNaN(numericId))
            return reply.code(400).send({ message: 'Invalid userId' });
        const check = await (0, academy_service_1.getGraduationCheck)(numericId);
        return reply.send(check);
    }
    catch (error) {
        console.error('[academy:graduationCheck]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function approveTerritoryHandler(request, reply) {
    try {
        const { userId, directorId } = request.body;
        if (!userId || !directorId) {
            return reply.code(400).send({ message: 'userId and directorId are required' });
        }
        const result = await (0, academy_service_1.directorApproveTerritory)(Number(userId), Number(directorId));
        return reply.send(result);
    }
    catch (error) {
        console.error('[academy:approveTerritory]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function syncChecklistHandler(request, reply) {
    try {
        const { userId } = request.body;
        if (!userId)
            return reply.code(400).send({ message: 'userId is required' });
        const numericId = Number(userId);
        if (isNaN(numericId))
            return reply.code(400).send({ message: 'Invalid userId' });
        const checklist = await (0, academy_service_1.syncChecklist)(numericId);
        return reply.send(checklist);
    }
    catch (error) {
        console.error('[academy:syncChecklist]', error.message);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
//# sourceMappingURL=academy.controller.js.map