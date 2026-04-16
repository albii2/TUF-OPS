import { FastifyInstance } from 'fastify';
import { createOrganizationHandler, getOrganizationsHandler } from './organizations.controller';

export async function organizationRoutes(server: FastifyInstance) {
  server.post('/', createOrganizationHandler);
  server.get('/', getOrganizationsHandler);
}
