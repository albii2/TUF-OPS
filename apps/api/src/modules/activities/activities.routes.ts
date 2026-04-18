import { FastifyInstance } from 'fastify';
import { createActivityHandler, getActivitiesByOpportunityHandler, getActivitiesByOrganizationHandler, markActivityCompleteHandler } from './activities.controller';

export async function activityRoutes(server: FastifyInstance) {
  server.post('/', createActivityHandler);
  server.get('/opportunity/:opportunityId', getActivitiesByOpportunityHandler);
  server.get('/organization/:organizationId', getActivitiesByOrganizationHandler);
  server.put('/:id/complete', markActivityCompleteHandler);
}
