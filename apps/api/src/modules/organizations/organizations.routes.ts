import { FastifyInstance } from 'fastify';
import { backfillOrganizationChannelsHandler, createOrganizationHandler, getOrganizationByIdHandler, getOrganizationsHandler, updateOrganizationHandler, deleteOrganizationHandler } from './organizations.controller';

export async function organizationRoutes(server: FastifyInstance) {
  server.post('/', createOrganizationHandler);
  server.get('/', getOrganizationsHandler);
  server.post('/backfill-channels', backfillOrganizationChannelsHandler);
  server.get('/:id', getOrganizationByIdHandler);
  server.put('/:id', updateOrganizationHandler);
  server.delete('/:id', deleteOrganizationHandler);
}
