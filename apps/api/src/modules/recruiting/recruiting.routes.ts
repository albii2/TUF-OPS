import { FastifyInstance } from 'fastify';
import { requireCertification, requirePermission, permissions } from '../../auth';
import {
  createCandidateHandler,
  getCandidatesHandler,
  getCandidateByIdHandler,
  updateCandidateHandler,
  uploadResumeHandler,
  getCandidateActivitiesHandler,
  getRecruitingDashboardHandler,
} from './recruiting.controller';

export async function recruitingRoutes(server: FastifyInstance) {
  // All recruiting routes require INVITE_USER permission (Director+)
  const pre = [requireCertification(), requirePermission(permissions.INVITE_USER)];

  server.post('/', { preHandler: pre }, createCandidateHandler);
  server.get('/', { preHandler: pre }, getCandidatesHandler);
  server.get('/dashboard', { preHandler: pre }, getRecruitingDashboardHandler);
  server.get('/:id', { preHandler: pre }, getCandidateByIdHandler);
  server.put('/:id', { preHandler: pre }, updateCandidateHandler);
  server.post('/:id/resume', { preHandler: pre }, uploadResumeHandler);
  server.get('/:id/activities', { preHandler: pre }, getCandidateActivitiesHandler);
}
