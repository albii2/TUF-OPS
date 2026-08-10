import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  getExecutiveSummary,
  getParticipants,
  getParticipantDetail,
  getRecentActivityFeed,
  logEvent,
} from './academy-command.service';

export async function getExecutiveSummaryHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const data = await getExecutiveSummary(request.currentUser);
    return reply.send(data);
  } catch (err: any) {
    if (err.message === 'Authentication required') return reply.code(401).send({ error: err.message });
    if (err.message?.includes('Only leadership')) return reply.code(403).send({ error: err.message });
    request.log.error(err);
    return reply.code(500).send({ error: 'Failed to fetch executive summary' });
  }
}

export async function getParticipantsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const data = await getParticipants(request.currentUser);
    return reply.send(data);
  } catch (err: any) {
    if (err.message === 'Authentication required') return reply.code(401).send({ error: err.message });
    if (err.message?.includes('Only leadership')) return reply.code(403).send({ error: err.message });
    request.log.error(err);
    return reply.code(500).send({ error: 'Failed to fetch participants' });
  }
}

export async function getParticipantDetailHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { userId } = request.params as { userId: string };
    const data = await getParticipantDetail(Number(userId), request.currentUser);
    if (!data) return reply.code(404).send({ error: 'Participant not found' });
    return reply.send(data);
  } catch (err: any) {
    if (err.message === 'Authentication required') return reply.code(401).send({ error: err.message });
    if (err.message?.includes('Only leadership')) return reply.code(403).send({ error: err.message });
    request.log.error(err);
    return reply.code(500).send({ error: 'Failed to fetch participant detail' });
  }
}

export async function getRecentActivityHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const { filter } = request.query as { filter?: string };
    const limit = filter === 'all' ? 200 : 50;
    const data = await getRecentActivityFeed(limit);
    return reply.send(data);
  } catch (err: any) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Failed to fetch recent activity' });
  }
}

export async function logEventHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const user = request.currentUser;
    if (!user) return reply.code(401).send({ error: 'Authentication required' });

    const payload = request.body as {
      event_type: string;
      entity_type?: string;
      entity_id?: number;
      metadata?: Record<string, unknown>;
    };

    if (!payload.event_type) {
      return reply.code(400).send({ error: 'event_type is required' });
    }

    await logEvent(user.id, {
      event_type: payload.event_type as any,
      entity_type: payload.entity_type,
      entity_id: payload.entity_id,
      metadata: payload.metadata,
    });

    return reply.code(201).send({ ok: true });
  } catch (err: any) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Failed to log event' });
  }
}
