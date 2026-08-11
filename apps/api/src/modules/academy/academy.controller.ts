import { FastifyRequest, FastifyReply } from 'fastify';
import {
  getFullProgress,
  getOrCreateProgress,
  updatePhaseCompletion,
  getOrCreateMissions,
  startMission,
  submitMission,
  getMissionsWithReviews,
  createReview,
  getGraduationCheck,
  directorApproveTerritory,
  getPendingReviews,
  syncChecklist,
} from './academy.service';
import { AcademyPhase, DirectorReviewStatus } from './academy.interface';

// ─── Progress ──────────────────────────────────────────────────────

export async function getProgressHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = request.query as any;
    if (!userId) return reply.code(400).send({ message: 'userId is required' });

    const numericId = Number(userId);
    if (isNaN(numericId)) return reply.code(400).send({ message: 'Invalid userId' });

    const progress = await getFullProgress(numericId);
    return reply.send(progress);
  } catch (error: any) {
    console.error('[academy:getProgress]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function updatePhaseHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId, phase, completed } = request.body as any;
    if (!userId || !phase || completed === undefined) {
      return reply.code(400).send({ message: 'userId, phase, and completed are required' });
    }

    const validPhases = Object.values(AcademyPhase);
    if (!validPhases.includes(phase)) {
      return reply.code(400).send({ message: `Invalid phase. Must be one of: ${validPhases.join(', ')}` });
    }

    const numericId = Number(userId);
    if (isNaN(numericId)) return reply.code(400).send({ message: 'Invalid userId' });

    const result = await updatePhaseCompletion(numericId, phase as AcademyPhase, !!completed);
    return reply.send(result);
  } catch (error: any) {
    console.error('[academy:updatePhase]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

// ─── Missions ──────────────────────────────────────────────────────

export async function getMissionsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = request.query as any;
    if (!userId) return reply.code(400).send({ message: 'userId is required' });

    const numericId = Number(userId);
    if (isNaN(numericId)) return reply.code(400).send({ message: 'Invalid userId' });

    const missions = await getOrCreateMissions(numericId);
    return reply.send(missions);
  } catch (error: any) {
    console.error('[academy:getMissions]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function startMissionHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId, missionNumber } = request.body as any;
    if (!userId || !missionNumber) {
      return reply.code(400).send({ message: 'userId and missionNumber are required' });
    }

    const numericId = Number(userId);
    const missionNum = Number(missionNumber);
    if (isNaN(numericId) || isNaN(missionNum)) {
      return reply.code(400).send({ message: 'Invalid userId or missionNumber' });
    }

    const mission = await startMission(numericId, missionNum);
    return reply.send(mission);
  } catch (error: any) {
    console.error('[academy:startMission]', error.message);
    if (error.message.includes('not available')) {
      return reply.code(400).send({ message: error.message });
    }
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function submitMissionHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId, missionNumber } = request.body as any;
    if (!userId || !missionNumber) {
      return reply.code(400).send({ message: 'userId and missionNumber are required' });
    }

    const numericId = Number(userId);
    const missionNum = Number(missionNumber);
    if (isNaN(numericId) || isNaN(missionNum)) {
      return reply.code(400).send({ message: 'Invalid userId or missionNumber' });
    }

    const mission = await submitMission(numericId, missionNum);
    return reply.send(mission);
  } catch (error: any) {
    console.error('[academy:submitMission]', error.message);
    if (error.message.includes('not in progress')) {
      return reply.code(400).send({ message: error.message });
    }
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function getMissionsWithReviewsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = request.query as any;
    if (!userId) return reply.code(400).send({ message: 'userId is required' });

    const numericId = Number(userId);
    if (isNaN(numericId)) return reply.code(400).send({ message: 'Invalid userId' });

    const missions = await getMissionsWithReviews(numericId);
    return reply.send(missions);
  } catch (error: any) {
    console.error('[academy:getMissionsWithReviews]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

// ─── Director Reviews ──────────────────────────────────────────────

export async function createReviewHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { missionId, reviewerId, status, strengths, corrections, coachingNotes } = request.body as any;

    if (!missionId || !reviewerId || !status) {
      return reply.code(400).send({ message: 'missionId, reviewerId, and status are required' });
    }

    if (!Object.values(DirectorReviewStatus).includes(status)) {
      return reply.code(400).send({ message: `Invalid status. Must be one of: ${Object.values(DirectorReviewStatus).join(', ')}` });
    }

    const review = await createReview(
      Number(missionId),
      Number(reviewerId),
      status,
      strengths || '',
      corrections || '',
      coachingNotes || ''
    );
    return reply.code(201).send(review);
  } catch (error: any) {
    console.error('[academy:createReview]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function getPendingReviewsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const pending = await getPendingReviews();
    return reply.send(pending);
  } catch (error: any) {
    console.error('[academy:getPendingReviews]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

// ─── Graduation ────────────────────────────────────────────────────

export async function getGraduationCheckHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = request.query as any;
    if (!userId) return reply.code(400).send({ message: 'userId is required' });

    const numericId = Number(userId);
    if (isNaN(numericId)) return reply.code(400).send({ message: 'Invalid userId' });

    const check = await getGraduationCheck(numericId);
    return reply.send(check);
  } catch (error: any) {
    console.error('[academy:graduationCheck]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function approveTerritoryHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId, directorId } = request.body as any;
    if (!userId || !directorId) {
      return reply.code(400).send({ message: 'userId and directorId are required' });
    }

    const result = await directorApproveTerritory(Number(userId), Number(directorId));
    return reply.send(result);
  } catch (error: any) {
    console.error('[academy:approveTerritory]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function syncChecklistHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = request.body as any;
    if (!userId) return reply.code(400).send({ message: 'userId is required' });

    const numericId = Number(userId);
    if (isNaN(numericId)) return reply.code(400).send({ message: 'Invalid userId' });

    const checklist = await syncChecklist(numericId);
    return reply.send(checklist);
  } catch (error: any) {
    console.error('[academy:syncChecklist]', error.message);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}
