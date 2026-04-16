import { FastifyInstance } from 'fastify';
import { createOrganizationHandler, getOrganizationsHandler, updateOrganizationHandler, deleteOrganizationHandler } from './organizations.controller';

export async function organizationRoutes(server: FastifyInstance) {
  server.post('/', createOrganizationHandler);
  server.get('/', getOrganizationsHandler);
  server.put('/:id', updateOrganizationHandler);
  server.delete('/:id', deleteOrganizationHandler);
}
