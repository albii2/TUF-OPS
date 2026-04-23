import { FastifyInstance } from 'fastify';
import { createOpportunityHandler, getOpportunityByIdHandler, getOpportunitiesByOrganizationHandler, getOpportunitiesHandler, updateOpportunityStageHandler } from './opportunities.controller';

export async function opportunityRoutes(server: FastifyInstance) {
  server.post('/', createOpportunityHandler);
  server.get('/', getOpportunitiesHandler);
  server.get('/organization/:organizationId', getOpportunitiesByOrganizationHandler);
  server.get('/:id', getOpportunityByIdHandler);
  server.put('/:id/stage', updateOpportunityStageHandler);
}
