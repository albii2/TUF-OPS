import type { FastifyReply, FastifyRequest } from 'fastify';
import { upsertDailyActivity, getTodayActivities, getActivityHistory } from './daily-activities.service';
import type { DailyActivityInput } from './daily-activities.interface';

export async function upsertDailyActivityHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.currentUser) {
    return reply.code(401).send({ error: 'Authentication required' });
  }
  try {
    const activity = await upsertDailyActivity(request.currentUser.id, request.body as DailyActivityInput);
    return reply.code(200).send(activity);
  } catch (error: any) {
    return reply.code(500).send({ error: error?.message || 'Failed to save activity' });
  }
}

export async function getTodayActivitiesHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.currentUser) {
    return reply.code(401).send({ error: 'Authentication required' });
  }
  try {
    const activities = await getTodayActivities(request.currentUser.id, request.currentUser.role);
    return reply.send({ activities, date: new Date().toISOString().slice(0, 10) });
  } catch (error: any) {
    return reply.code(500).send({ error: error?.message || 'Failed to get activities' });
  }
}

export async function getActivityHistoryHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.currentUser) {
    return reply.code(401).send({ error: 'Authentication required' });
  }
  try {
    const { days } = request.query as { days?: string };
    const history = await getActivityHistory(request.currentUser.id, Number(days) || 7);
    return reply.send({ history });
  } catch (error: any) {
    return reply.code(500).send({ error: error?.message || 'Failed to get history' });
  }
}
