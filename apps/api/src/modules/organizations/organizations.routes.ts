import { FastifyInstance } from 'fastify';
import { permissions, requirePermission } from '../../auth';
import { createOrganizationHandler, getOrganizationsHandler, getOrganizationByIdHandler, updateOrganizationHandler, deleteOrganizationHandler } from './organizations.controller';

export async function organizationRoutes(server: FastifyInstance) {
  server.post('/', { preHandler: requirePermission(permissions.CREATE_ORGANIZATION) }, createOrganizationHandler);
  server.get('/', { preHandler: requirePermission(permissions.VIEW_ORGANIZATION_OWN) }, getOrganizationsHandler);
  server.get('/:id', { preHandler: requirePermission(permissions.VIEW_ORGANIZATION_OWN) }, getOrganizationByIdHandler);
  server.put('/:id', { preHandler: requirePermission(permissions.EDIT_ORGANIZATION_OWN) }, updateOrganizationHandler);
  server.delete('/:id', { preHandler: requirePermission(permissions.CONFIGURE_TERRITORY) }, deleteOrganizationHandler);
}
