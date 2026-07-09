import { FastifyInstance } from 'fastify';
import { upsertDailyActivityHandler, getTodayActivitiesHandler, getActivityHistoryHandler } from './daily-activities.controller';
import { requireCertification } from '../../auth';

export async function dailyActivityRoutes(server: FastifyInstance) {
  server.post('/', { preHandler: [requireCertification()] }, upsertDailyActivityHandler);
  server.get('/today', { preHandler: [requireCertification()] }, getTodayActivitiesHandler);
  server.get('/history', { preHandler: [requireCertification()] }, getActivityHistoryHandler);
}
