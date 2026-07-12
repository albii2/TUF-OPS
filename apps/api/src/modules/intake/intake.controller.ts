import { FastifyReply, FastifyRequest } from 'fastify';
import { createIntakeItem, getIntakeItems, getIntakeItem, updateIntakeItem, deleteIntakeItem, getOpenDecisions } from './intake.service';

export async function listHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const filters = (request.query as any) || {};
    const items = await getIntakeItems(filters);
    return reply.send({ items });
  } catch (error) {
    return reply.code(500).send({ error: 'Failed to fetch intake items' });
  }
}

export async function getHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const item = await getIntakeItem(Number(request.params.id));
    if (!item) return reply.code(404).send({ error: 'Not found' });
    return reply.send({ item });
  } catch (error) {
    return reply.code(500).send({ error: 'Failed to fetch item' });
  }
}

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = request.body as any;
    if (!body.title?.trim()) {
      return reply.code(400).send({ error: 'Title is required' });
    }
    const user = (request as any).user;
    const item = await createIntakeItem({
      ...body,
      created_by: user?.id || body.created_by,
    });
    return reply.code(201).send({ item });
  } catch (error) {
    return reply.code(500).send({ error: 'Failed to create item' });
  }
}

export async function updateHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const body = request.body as any;
    const user = (request as any).user;
    const item = await updateIntakeItem(Number(request.params.id), {
      ...body,
      updated_by: user?.id || body.updated_by,
    });
    if (!item) return reply.code(404).send({ error: 'Not found' });
    return reply.send({ item });
  } catch (error) {
    return reply.code(500).send({ error: 'Failed to update item' });
  }
}

export async function deleteHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const deleted = await deleteIntakeItem(Number(request.params.id));
    if (!deleted) return reply.code(404).send({ error: 'Not found' });
    return reply.send({ success: true });
  } catch (error) {
    return reply.code(500).send({ error: 'Failed to delete item' });
  }
}

export async function decisionsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const items = await getOpenDecisions();
    return reply.send({ items });
  } catch (error) {
    return reply.code(500).send({ error: 'Failed to fetch decisions' });
  }
}
