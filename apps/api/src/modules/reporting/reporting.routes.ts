import { FastifyInstance } from 'fastify';
import {
  getAdminDashboardMetricsHandler,
  getCommissionMetricsHandler,
  getDirectorDashboardMetricsHandler,
  getOwnerDashboardMetricsHandler,
  getRepDashboardMetricsHandler,
  getSchoolCoverageMetricsHandler,
} from './reporting.controller';

export async function reportingRoutes(server: FastifyInstance) {
  server.get('/owner-dashboard', getOwnerDashboardMetricsHandler);
  server.get('/admin-dashboard', getAdminDashboardMetricsHandler);
  server.get('/director-dashboard/:directorId', getDirectorDashboardMetricsHandler);
  server.get('/rep-dashboard/:repId', getRepDashboardMetricsHandler);
  server.get('/school-coverage', getSchoolCoverageMetricsHandler);
  server.get('/commissions', getCommissionMetricsHandler);
}
