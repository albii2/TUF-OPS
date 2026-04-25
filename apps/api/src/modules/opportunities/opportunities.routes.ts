import { FastifyInstance } from 'fastify';
import { createOpportunityHandler, getOpportunitiesHandler, getOpportunitiesByOrganizationHandler, updateOpportunityStageHandler } from './opportunities.controller';

export async function opportunityRoutes(server: FastifyInstance) {
  server.get('/', getOpportunitiesHandler);
  server.post('/', createOpportunityHandler);
  server.get('/organization/:organizationId', getOpportunitiesByOrganizationHandler);
  server.put('/:id/stage', updateOpportunityStageHandler);
}
