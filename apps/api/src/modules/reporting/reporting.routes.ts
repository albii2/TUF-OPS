import { FastifyInstance } from 'fastify';
import { getOwnerDashboardMetricsHandler, getDirectorDashboardMetricsHandler, getRepDashboardMetricsHandler } from './reporting.controller';

export async function reportingRoutes(server: FastifyInstance) {
  server.get('/owner', getOwnerDashboardMetricsHandler);
  server.get('/director/:directorId', getDirectorDashboardMetricsHandler);
  server.get('/rep/:repId', getRepDashboardMetricsHandler);
}
