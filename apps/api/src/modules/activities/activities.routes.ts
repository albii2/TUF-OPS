import { FastifyInstance } from 'fastify';
import { createActivityHandler, getActivitiesByOpportunityHandler, getActivitiesByOrganizationHandler, markActivityCompleteHandler, createRepActivityHandler, getRepActivitiesByOpportunityHandler } from './activities.controller';
import { requirePermission, permissions } from '../../auth';

export async function activityRoutes(server: FastifyInstance) {
  server.post('/', createActivityHandler);
  server.get('/opportunity/:opportunityId', getActivitiesByOpportunityHandler);
  server.get('/organization/:organizationId', getActivitiesByOrganizationHandler);
  server.put('/:id/complete', markActivityCompleteHandler);

  // RepActivity (prospecting) endpoints — protected by LOG_RELATIONSHIP_ACTIVITY
  server.post('/rep', {
    preHandler: [requirePermission(permissions.LOG_RELATIONSHIP_ACTIVITY)],
  }, createRepActivityHandler);

  server.get('/rep', {
    preHandler: [requirePermission(permissions.LOG_RELATIONSHIP_ACTIVITY)],
  }, getRepActivitiesByOpportunityHandler);
}
