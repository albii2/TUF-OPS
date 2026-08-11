import { FastifyInstance } from 'fastify';
import { requireCertification, requirePermission, permissions } from '../../auth';
import {
  getProgressHandler,
  updatePhaseHandler,
  getMissionsHandler,
  startMissionHandler,
  submitMissionHandler,
  getMissionsWithReviewsHandler,
  createReviewHandler,
  getPendingReviewsHandler,
  getGraduationCheckHandler,
  approveTerritoryHandler,
  syncChecklistHandler,
} from './academy.controller';

// Director+ only preHandler for review endpoints
const directorAuth = [requireCertification(), requirePermission(permissions.INVITE_USER)];

export async function academyRoutes(server: FastifyInstance) {
  // ── TAE-facing endpoints (open for uncertified users during training) ──
  server.get('/progress', getProgressHandler);
  server.post('/progress/phase', updatePhaseHandler);
  server.get('/missions', getMissionsHandler);
  server.post('/missions/start', startMissionHandler);
  server.post('/missions/submit', submitMissionHandler);
  server.get('/missions/reviews', getMissionsWithReviewsHandler);
  server.get('/graduation-check', getGraduationCheckHandler);
  server.post('/checklist/sync', syncChecklistHandler);

  // ── Director-facing endpoints ──
  server.post('/reviews', { preHandler: directorAuth }, createReviewHandler);
  server.get('/reviews/pending', { preHandler: directorAuth }, getPendingReviewsHandler);
  server.post('/territory/approve', { preHandler: directorAuth }, approveTerritoryHandler);
}
