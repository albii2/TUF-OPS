import { FastifyInstance } from 'fastify';
import { permissions, requirePermission, requireStageAwareEditPermission, requireStageAwareAdvancePermission } from '../../auth';
import { createOpportunityHandler, getOpportunitiesHandler, getOpportunitiesByOrganizationHandler, updateOpportunityStageHandler, updateOpportunityHandler } from './opportunities.controller';

export async function opportunityRoutes(server: FastifyInstance) {
  server.get('/', { preHandler: requirePermission(permissions.VIEW_OPPORTUNITY_OWN) }, getOpportunitiesHandler);
  server.post('/', { preHandler: requirePermission(permissions.CREATE_OPPORTUNITY) }, createOpportunityHandler);
  server.get('/organization/:organizationId', { preHandler: requirePermission(permissions.VIEW_OPPORTUNITY_OWN) }, getOpportunitiesByOrganizationHandler);

  // Stage advancement: TAE cannot advance beyond Closed Won.
  // The stage-aware preHandler checks the opportunity's current stage
  // and blocks TAE from advancing from Closed Won or later.
  server.put('/:id/stage', { preHandler: requireStageAwareAdvancePermission(permissions.ADVANCE_STAGE_PRE_CW) }, updateOpportunityStageHandler);

  // Opportunity edit: TAE loses edit access to order fields after Closed Won
  // but retains relationship field access at all stages.
  server.put('/:id', { preHandler: requireStageAwareEditPermission(permissions.EDIT_OPPORTUNITY_PRE_CW) }, updateOpportunityHandler);
}
