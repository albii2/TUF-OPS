import { FastifyReply, FastifyRequest } from 'fastify';
import { createComm, getComms, getComm, updateComm, deleteComm, getUpcomingComms } from './comms.service';

export async function listHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { status, recipient } = request.query as { status?: string; recipient?: string };
    const items = await getComms({ status, recipient });
    return reply.send({ comms: items });
  } catch (e: any) {
    request.log.error(e);
    return reply.code(500).send({ error: 'Failed to fetch comms' });
  }
}

export async function getHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const item = await getComm(Number(id));
    if (!item) return reply.code(404).send({ error: 'Comm not found' });
    return reply.send(item);
  } catch (e: any) {
    request.log.error(e);
    return reply.code(500).send({ error: 'Failed to fetch comm' });
  }
}

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = request.body as any;
    const user = (request as any).user;
    if (!user?.id) return reply.code(401).send({ error: 'Authentication required' });

    const item = await createComm({
      subject: body.subject,
      recipient: body.recipient,
      recipient_role: body.recipient_role,
      body: body.body,
      status: body.status,
      scheduled_for: body.scheduled_for,
      tags: body.tags,
      notes: body.notes,
      created_by: user.id,
    });
    return reply.code(201).send(item);
  } catch (e: any) {
    request.log.error(e);
    return reply.code(500).send({ error: 'Failed to create comm' });
  }
}

export async function updateHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const user = (request as any).user;
    if (!user?.id) return reply.code(401).send({ error: 'Authentication required' });

    const item = await updateComm(Number(id), { ...body, updated_by: user.id });
    if (!item) return reply.code(404).send({ error: 'Comm not found' });
    return reply.send(item);
  } catch (e: any) {
    request.log.error(e);
    return reply.code(500).send({ error: 'Failed to update comm' });
  }
}

export async function deleteHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const deleted = await deleteComm(Number(id));
    if (!deleted) return reply.code(404).send({ error: 'Comm not found' });
    return reply.send({ success: true });
  } catch (e: any) {
    request.log.error(e);
    return reply.code(500).send({ error: 'Failed to delete comm' });
  }
}

export async function upcomingHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { hours } = request.query as { hours?: string };
    const items = await getUpcomingComms(Number(hours) || 24);
    return reply.send({ comms: items });
  } catch (e: any) {
    request.log.error(e);
    return reply.code(500).send({ error: 'Failed to fetch upcoming comms' });
  }
}
