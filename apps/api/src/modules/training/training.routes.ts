import { FastifyInstance } from 'fastify';
import {
  getModulesByRoleHandler,
  enrollUserHandler,
  getEnrollmentHandler,
  startModuleHandler,
  completeModuleHandler,
  getProgressHandler,
  recordFrictionPointHandler,
  toggleHrDocsHandler,
  togglePracticalExerciseHandler,
  toggleDirectorSignoffHandler,
  getCertificationStatusHandler,
  submitModuleAssessmentHandler,
} from './training.controller';

export async function trainingRoutes(server: FastifyInstance) {
  // Get modules by role (with optional phase filter)
  server.get('/modules', getModulesByRoleHandler);

  // Get user's current enrollment + progress
  server.get('/enrollment', getEnrollmentHandler);

  // Enroll user in training
  server.post('/enrollment/start', enrollUserHandler);

  // Start a module
  server.post('/progress/start', startModuleHandler);

  // Complete a module
  server.post('/progress/complete', completeModuleHandler);

  // Submit module quiz / knowledge check
  server.post('/assessments/submit', submitModuleAssessmentHandler);

  // Get detailed progress for an enrollment
  server.get('/progress/:enrollmentId', getProgressHandler);

  // Record a friction point
  server.post('/friction-point', recordFrictionPointHandler);

  // Toggle HR documents completion
  server.post('/reps/:id/hr-docs', toggleHrDocsHandler);

  // Toggle practical exercise completion
  server.post('/reps/:id/practical-exercise', togglePracticalExerciseHandler);

  // Toggle Director sign-off
  server.post('/reps/:id/director-signoff', toggleDirectorSignoffHandler);

  // Retrieve certification status
  server.get('/reps/:id/certification-status', getCertificationStatusHandler);
}

