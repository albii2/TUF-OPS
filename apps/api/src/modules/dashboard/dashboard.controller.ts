import { FastifyReply, FastifyRequest } from 'fastify';
import { getExecutiveDashboard } from './dashboard.service';

export async function executiveDashboardHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await getExecutiveDashboard();
    return reply.send(data);
  } catch (e) {
    return reply.code(500).send({ error: 'Dashboard query failed' });
  }
}
