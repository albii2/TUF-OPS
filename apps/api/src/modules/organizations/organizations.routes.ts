import { FastifyInstance } from 'fastify';
import { permissions, requireCertification, requirePermission } from '../../auth';
import { createOrganizationHandler, getOrganizationsHandler, getOrganizationByIdHandler, updateOrganizationHandler, deleteOrganizationHandler } from './organizations.controller';

export async function organizationRoutes(server: FastifyInstance) {
  server.post('/', { preHandler: [requireCertification(), requirePermission(permissions.CREATE_ORGANIZATION)] }, createOrganizationHandler);
  server.get('/', { preHandler: [requireCertification(), requirePermission(permissions.VIEW_ORGANIZATION_OWN)] }, getOrganizationsHandler);
  server.get('/:id', { preHandler: [requireCertification(), requirePermission(permissions.VIEW_ORGANIZATION_OWN)] }, getOrganizationByIdHandler);
  server.put('/:id', { preHandler: [requireCertification(), requirePermission(permissions.EDIT_ORGANIZATION_OWN)] }, updateOrganizationHandler);
  server.delete('/:id', { preHandler: [requireCertification(), requirePermission(permissions.CONFIGURE_TERRITORY)] }, deleteOrganizationHandler);
}
