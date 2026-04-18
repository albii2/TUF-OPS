import { FastifyInstance } from 'fastify';
import { createOpportunityHandler, getOpportunitiesByOrganizationHandler, updateOpportunityStageHandler } from './opportunities.controller';

export async function opportunityRoutes(server: FastifyInstance) {
  server.post('/', createOpportunityHandler);
  server.get('/organization/:organizationId', getOpportunitiesByOrganizationHandler);
  server.put('/:id/stage', updateOpportunityStageHandler);
}
