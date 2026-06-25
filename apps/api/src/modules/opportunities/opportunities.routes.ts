import { FastifyInstance } from 'fastify';
import { permissions, requirePermission } from '../../auth';
import { createOpportunityHandler, getOpportunitiesHandler, getOpportunitiesByOrganizationHandler, updateOpportunityStageHandler, updateOpportunityHandler } from './opportunities.controller';

export async function opportunityRoutes(server: FastifyInstance) {
  server.get('/', { preHandler: requirePermission(permissions.VIEW_OPPORTUNITY_OWN) }, getOpportunitiesHandler);
  server.post('/', { preHandler: requirePermission(permissions.CREATE_OPPORTUNITY) }, createOpportunityHandler);
  server.get('/organization/:organizationId', { preHandler: requirePermission(permissions.VIEW_OPPORTUNITY_OWN) }, getOpportunitiesByOrganizationHandler);
  server.put('/:id/stage', { preHandler: requirePermission(permissions.ADVANCE_STAGE_PRE_CW) }, updateOpportunityStageHandler);
  server.put('/:id', { preHandler: requirePermission(permissions.EDIT_OPPORTUNITY_PRE_CW) }, updateOpportunityHandler);
}
