import { FastifyRequest, FastifyReply } from 'fastify';
import { getOwnerDashboardData } from './owner_dashboard.service';
import { getDirectorDashboardMetrics, getRepDashboardMetrics } from './reporting.service';

export async function getOwnerDashboardMetricsHandler(request: FastifyRequest, reply: FastifyReply) {
  const metrics = await getOwnerDashboardData();
  return reply.send(metrics);
}

export async function getDirectorDashboardMetricsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { directorId } = request.params as any;
  const metrics = await getDirectorDashboardMetrics(Number(directorId));
  return reply.send(metrics);
}

export async function getRepDashboardMetricsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { repId } = request.params as any;
  const metrics = await getRepDashboardMetrics(Number(repId));
  return reply.send(metrics);
}
