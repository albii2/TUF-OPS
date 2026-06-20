import { FastifyRequest, FastifyReply } from 'fastify';
import {
  getAdminDashboardMetrics,
  getCommissionMetrics,
  getDirectorDashboardMetrics,
  getOwnerDashboardMetrics,
  getRepDashboardMetrics,
  getSchoolCoverageMetrics,
} from './reporting.service';

// TODO(v0.9 auth hardening): these reporting endpoints are intentionally server-owned
// calculations, but this app version still lacks a complete request auth context in
// Fastify. Until auth middleware injects the authenticated actor id/role, do not expose
// id-scoped endpoints outside trusted production routing/API gateway controls.
export async function getOwnerDashboardMetricsHandler(_request: FastifyRequest, reply: FastifyReply) {
  const metrics = await getOwnerDashboardMetrics();
  return reply.send(metrics);
}

export async function getAdminDashboardMetricsHandler(_request: FastifyRequest, reply: FastifyReply) {
  const metrics = await getAdminDashboardMetrics();
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

export async function getSchoolCoverageMetricsHandler(_request: FastifyRequest, reply: FastifyReply) {
  const metrics = await getSchoolCoverageMetrics();
  return reply.send(metrics);
}

export async function getCommissionMetricsHandler(_request: FastifyRequest, reply: FastifyReply) {
  const metrics = await getCommissionMetrics();
  return reply.send(metrics);
}
