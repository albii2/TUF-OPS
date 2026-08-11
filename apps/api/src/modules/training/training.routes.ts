import { FastifyInstance } from 'fastify';
import { requireCertification, requirePermission, permissions } from '../../auth';
import {
  getModulesByRoleHandler,
  enrollUserHandler,
  getEnrollmentHandler,
  startModuleHandler,
  completeModuleHandler,
  getProgressHandler,
  recordFrictionPointHandler,
  getFrictionPointsHandler,
  toggleHrDocsHandler,
  togglePracticalExerciseHandler,
  toggleDirectorSignoffHandler,
  getCertificationStatusHandler,
  submitModuleAssessmentHandler,
  evaluateScriptHandler,
} from './training.controller';

// Director+ only preHandler for cert-management endpoints
const directorAuth = [requireCertification(), requirePermission(permissions.INVITE_USER)];

export async function trainingRoutes(server: FastifyInstance) {
  // Onboarding endpoints — open for uncertified users (no certification gate)
  server.get('/modules', getModulesByRoleHandler);
  server.get('/enrollment', getEnrollmentHandler);
  server.post('/enrollment/start', enrollUserHandler);
  server.post('/progress/start', startModuleHandler);
  server.post('/progress/complete', completeModuleHandler);
  server.post('/assessments/submit', submitModuleAssessmentHandler);
  server.post('/assessments/evaluate-script', evaluateScriptHandler);
  server.get('/progress/:enrollmentId', getProgressHandler);
  server.post('/friction-point', recordFrictionPointHandler);

  // Authenticated endpoints — require certification
  server.get('/friction-points', { preHandler: [requireCertification()] }, getFrictionPointsHandler);

  // Director+ certification management
  server.post('/reps/:id/hr-docs', { preHandler: directorAuth }, toggleHrDocsHandler);
  server.post('/reps/:id/practical-exercise', { preHandler: directorAuth }, togglePracticalExerciseHandler);
  server.post('/reps/:id/director-signoff', { preHandler: directorAuth }, toggleDirectorSignoffHandler);
  server.get('/reps/:id/certification-status', { preHandler: directorAuth }, getCertificationStatusHandler);
}

