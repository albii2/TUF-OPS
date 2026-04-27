import { FastifyInstance } from 'fastify';
import { getOwnerDashboardMetricsHandler, getDirectorDashboardMetricsHandler, getRepDashboardMetricsHandler } from './reporting.controller';

export async function reportingRoutes(server: FastifyInstance) {
  server.get('/owner-dashboard', getOwnerDashboardMetricsHandler);
  server.get('/director-dashboard/:directorId', getDirectorDashboardMetricsHandler);
  server.get('/rep-dashboard/:repId', getRepDashboardMetricsHandler);
}
