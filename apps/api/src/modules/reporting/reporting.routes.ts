import { FastifyInstance } from 'fastify';
import { permissions, requireCertification, requirePermission } from '../../auth';
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
  server.get('/owner-dashboard', { preHandler: [requireCertification(), requirePermission(permissions.VIEW_TERRITORY_HEALTH)] }, getOwnerDashboardMetricsHandler);
  server.get('/admin-dashboard', { preHandler: [requireCertification(), requirePermission(permissions.VIEW_TERRITORY_HEALTH)] }, getAdminDashboardMetricsHandler);
  server.get('/director-dashboard-by-email', { preHandler: [requireCertification(), requirePermission(permissions.VIEW_TEAM_PIPELINE)] }, getDirectorDashboardMetricsByEmailHandler);
  server.get('/rep-dashboard-by-email', { preHandler: [requireCertification(), requirePermission(permissions.VIEW_PERSONAL_PIPELINE)] }, getRepDashboardMetricsByEmailHandler);
  server.get('/director-dashboard/:directorId', { preHandler: [requireCertification(), requirePermission(permissions.VIEW_TEAM_PIPELINE)] }, getDirectorDashboardMetricsHandler);
  server.get('/rep-dashboard/:repId', { preHandler: [requireCertification(), requirePermission(permissions.VIEW_PERSONAL_PIPELINE)] }, getRepDashboardMetricsHandler);
  server.get('/school-coverage', { preHandler: [requireCertification(), requirePermission(permissions.VIEW_TERRITORY_HEALTH)] }, getSchoolCoverageMetricsHandler);
  server.get('/commissions', { preHandler: [requireCertification(), requirePermission(permissions.VIEW_PERSONAL_PIPELINE)] }, getCommissionMetricsHandler);
}
