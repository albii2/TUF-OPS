import { FastifyInstance } from 'fastify';
import { createActivityHandler, getActivitiesByOpportunityHandler, getActivitiesByOrganizationHandler, markActivityCompleteHandler, createRepActivityHandler, getRepActivitiesByOpportunityHandler, listActivitiesHandler } from './activities.controller';
import { requireCertification, requirePermission, permissions } from '../../auth';

export async function activityRoutes(server: FastifyInstance) {
  server.get('/', { preHandler: [requireCertification()] }, listActivitiesHandler);
  server.post('/', { preHandler: [requireCertification()] }, createActivityHandler);
  server.get('/opportunity/:opportunityId', { preHandler: [requireCertification()] }, getActivitiesByOpportunityHandler);
  server.get('/organization/:organizationId', { preHandler: [requireCertification()] }, getActivitiesByOrganizationHandler);
  server.put('/:id/complete', { preHandler: [requireCertification()] }, markActivityCompleteHandler);

  // RepActivity (prospecting) endpoints — protected by LOG_RELATIONSHIP_ACTIVITY
  server.post('/rep', {
    preHandler: [requireCertification(), requirePermission(permissions.LOG_RELATIONSHIP_ACTIVITY)],
  }, createRepActivityHandler);

  server.get('/rep', {
    preHandler: [requireCertification(), requirePermission(permissions.LOG_RELATIONSHIP_ACTIVITY)],
  }, getRepActivitiesByOpportunityHandler);
}
