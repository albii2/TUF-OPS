import { FastifyInstance } from 'fastify';
import { executiveDashboardHandler } from './dashboard.controller';

export async function dashboardRoutes(server: FastifyInstance) {
  server.get('/', executiveDashboardHandler);
}
