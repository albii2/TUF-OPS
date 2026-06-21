import { FastifyRequest, FastifyReply } from 'fastify';
import {
  getModulesByRole,
  enrollUserInTraining,
  getEnrollmentWithProgress,
  markModuleStarted,
  markModuleCompleted,
  getUserEnrollment,
  recordFrictionPoint,
  toggleHrDocs,
  togglePracticalExercise,
  toggleDirectorSignoff,
  getCertificationStatus,
  submitModuleAssessment,
} from './training.service';
import { TrainingRole } from './training.interface';


function canManageRepCertification(actorRole?: string) {
  return ['DIRECTOR', 'ADMIN', 'REGIONAL_DIRECTOR'].includes(String(actorRole || '').toUpperCase());
}

export async function getModulesByRoleHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { role, phase } = request.query as any;

    if (!role || !Object.values(TrainingRole).includes(role)) {
      return reply.code(400).send({ message: 'Valid role (TAE, REP, DIRECTOR, ADMIN) is required' });
    }

    const modules = await getModulesByRole(role, phase);
    return reply.send(modules);
  } catch (error: any) {
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function enrollUserHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId, role } = request.body as any;

    if (!userId || !role) {
      return reply.code(400).send({ message: 'userId and role are required' });
    }

    if (!Object.values(TrainingRole).includes(role)) {
      return reply.code(400).send({ message: 'Valid role (TAE, REP, DIRECTOR, ADMIN) is required' });
    }

    const enrollment = await enrollUserInTraining(userId, role);
    return reply.code(201).send(enrollment);
  } catch (error: any) {
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function getEnrollmentHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { userId } = request.query as any;

    if (!userId) {
      return reply.code(400).send({ message: 'userId query parameter is required' });
    }

    const enrollment = await getUserEnrollment(parseInt(userId, 10));

    if (!enrollment) {
      return reply.code(404).send({ message: 'Enrollment not found' });
    }

    const enrollmentWithProgress = await getEnrollmentWithProgress(enrollment.id);
    return reply.send(enrollmentWithProgress);
  } catch (error: any) {
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function startModuleHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { enrollmentId, moduleId } = request.body as any;

    if (!enrollmentId || !moduleId) {
      return reply.code(400).send({ message: 'enrollmentId and moduleId are required' });
    }

    const progress = await markModuleStarted(enrollmentId, moduleId);
    return reply.code(200).send(progress);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return reply.code(404).send({ message: error.message });
    }
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function completeModuleHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { enrollmentId, moduleId, timeSpentSeconds } = request.body as any;

    if (!enrollmentId || !moduleId) {
      return reply.code(400).send({ message: 'enrollmentId and moduleId are required' });
    }

    const result = await markModuleCompleted(enrollmentId, moduleId, timeSpentSeconds);
    return reply.send(result);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return reply.code(404).send({ message: error.message });
    }
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}


export async function submitModuleAssessmentHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { enrollmentId, moduleId, answers } = request.body as any;
    if (!enrollmentId || !moduleId || !Array.isArray(answers)) {
      return reply.code(400).send({ message: 'enrollmentId, moduleId, and answers are required' });
    }
    const result = await submitModuleAssessment(Number(enrollmentId), Number(moduleId), answers);
    return reply.send(result);
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('no quiz')) {
      return reply.code(404).send({ message: error.message });
    }
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function getProgressHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { enrollmentId } = request.params as any;

    if (!enrollmentId) {
      return reply.code(400).send({ message: 'enrollmentId is required' });
    }

    const enrollmentWithProgress = await getEnrollmentWithProgress(parseInt(enrollmentId, 10));
    return reply.send(enrollmentWithProgress);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return reply.code(404).send({ message: error.message });
    }
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function recordFrictionPointHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { enrollmentId, frictionPointText, moduleId, resolutionText } = request.body as any;

    if (!enrollmentId || !frictionPointText) {
      return reply.code(400).send({ message: 'enrollmentId and frictionPointText are required' });
    }

    await recordFrictionPoint(enrollmentId, frictionPointText, moduleId, resolutionText);
    return reply.code(201).send({ message: 'Friction point recorded' });
  } catch (error: any) {
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function toggleHrDocsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const { hrDocsCompleted } = request.body as any;

    if (id === undefined || hrDocsCompleted === undefined) {
      return reply.code(400).send({ message: 'User id and hrDocsCompleted are required' });
    }

    const result = await toggleHrDocs(parseInt(id, 10), !!hrDocsCompleted);
    return reply.send(result);
  } catch (error: any) {
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function togglePracticalExerciseHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const { practicalExerciseCompleted, actorRole } = request.body as any;

    if (!canManageRepCertification(actorRole)) {
      return reply.code(403).send({ message: 'Only director, admin, owner, or ops roles can mark practical exercises complete' });
    }

    if (id === undefined || practicalExerciseCompleted === undefined) {
      return reply.code(400).send({ message: 'User id and practicalExerciseCompleted are required' });
    }

    const result = await togglePracticalExercise(parseInt(id, 10), !!practicalExerciseCompleted);
    return reply.send(result);
  } catch (error: any) {
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function toggleDirectorSignoffHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const { directorSignedOff } = request.body as any;

    if (id === undefined || directorSignedOff === undefined) {
      return reply.code(400).send({ message: 'User id and directorSignedOff are required' });
    }

    const result = await toggleDirectorSignoff(parseInt(id, 10), !!directorSignedOff);
    return reply.send(result);
  } catch (error: any) {
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function getCertificationStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  try {
    if (!id) {
      return reply.code(400).send({ message: 'User id is required' });
    }

    const result = await getCertificationStatus(id);
    return reply.send(result);
  } catch (error: any) {
    console.error(`[getCertificationStatusHandler] EXACT CAUGHT ERROR: ${error.message}`, error.stack);

    const numericId = Number(id);
    if (isNaN(numericId)) {
      // For non-numeric IDs, any resolution failure should be returned as a 400 Bad Request
      return reply.code(400).send({
        error: "Unable to resolve user id",
        receivedId: id
      });
    }

    if (error.message.includes('not found') || error.message.includes('User not found')) {
      return reply.code(404).send({ message: error.message });
    }
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}
