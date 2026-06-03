import { FastifyInstance } from 'fastify';
import {
  getModulesByRoleHandler,
  enrollUserHandler,
  getEnrollmentHandler,
  startModuleHandler,
  completeModuleHandler,
  getProgressHandler,
  recordFrictionPointHandler,
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

  // Get detailed progress for an enrollment
  server.get('/progress/:enrollmentId', getProgressHandler);

  // Record a friction point
  server.post('/friction-point', recordFrictionPointHandler);
}
