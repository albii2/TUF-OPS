import { FastifyInstance } from 'fastify';
import { requireCertification } from '../../auth';
import { createOpportunityCreativeRequestHandler, getOpportunityCreativeRequestsHandler, patchCreativeRequestHandler } from './creative-requests.controller';

export async function creativeRequestRoutes(server: FastifyInstance) {
  server.get('/opportunities/:opportunityId/creative-requests', { preHandler: [requireCertification()] }, getOpportunityCreativeRequestsHandler);
  server.post('/opportunities/:opportunityId/creative-requests', { preHandler: [requireCertification()] }, createOpportunityCreativeRequestHandler);
  server.patch('/creative-requests/:id', { preHandler: [requireCertification()] }, patchCreativeRequestHandler);
}
