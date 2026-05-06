import { FastifyInstance } from 'fastify';
import { createOpportunityCreativeRequestHandler, getOpportunityCreativeRequestsHandler, patchCreativeRequestHandler } from './creative-requests.controller';

export async function creativeRequestRoutes(server: FastifyInstance) {
  server.get('/opportunities/:opportunityId/creative-requests', getOpportunityCreativeRequestsHandler);
  server.post('/opportunities/:opportunityId/creative-requests', createOpportunityCreativeRequestHandler);
  server.patch('/creative-requests/:id', patchCreativeRequestHandler);
}
