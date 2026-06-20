import { FastifyInstance } from 'fastify';
import {
  getAdminDashboardMetricsHandler,
  getCommissionMetricsHandler,
  getDirectorDashboardMetricsByEmailHandler,
  getDirectorDashboardMetricsHandler,
  getOwnerDashboardMetricsHandler,
  getRepDashboardMetricsByEmailHandler,
  getRepDashboardMetricsHandler,
  getSchoolCoverageMetricsHandler,
} from './reporting.controller';

export async function reportingRoutes(server: FastifyInstance) {
  server.get('/owner-dashboard', getOwnerDashboardMetricsHandler);
  server.get('/admin-dashboard', getAdminDashboardMetricsHandler);
  server.get('/director-dashboard-by-email', getDirectorDashboardMetricsByEmailHandler);
  server.get('/rep-dashboard-by-email', getRepDashboardMetricsByEmailHandler);
  server.get('/director-dashboard/:directorId', getDirectorDashboardMetricsHandler);
  server.get('/rep-dashboard/:repId', getRepDashboardMetricsHandler);
  server.get('/school-coverage', getSchoolCoverageMetricsHandler);
  server.get('/commissions', getCommissionMetricsHandler);
}
