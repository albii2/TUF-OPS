import { FastifyInstance } from 'fastify';
import { createOrganizationHandler, getOrganizationsHandler, getOrganizationByIdHandler, updateOrganizationHandler, deleteOrganizationHandler } from './organizations.controller';

export async function organizationRoutes(server: FastifyInstance) {
  server.post('/', createOrganizationHandler);
  server.get('/', getOrganizationsHandler);
  server.get('/:id', getOrganizationByIdHandler);
  server.put('/:id', updateOrganizationHandler);
  server.delete('/:id', deleteOrganizationHandler);
}
