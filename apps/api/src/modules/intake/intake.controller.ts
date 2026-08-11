import { FastifyReply, FastifyRequest } from 'fastify';
import { createIntakeItem, getIntakeItems, getIntakeItem, updateIntakeItem, deleteIntakeItem, getOpenDecisions, getLighthouseView, recalculateAttentionScores, createStatusCheckBatch, getStatusCheckSummary } from './intake.service';

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

/**
 * Executive Command Center — Lighthouse view
 * Returns scored, classified open items grouped by urgency.
 */
export async function lighthouseHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Optionally force recalculate scores if query param ?recalculate=1
    const query = (request.query as any) || {};
    if (query.recalculate === '1') {
      const count = await recalculateAttentionScores();
      console.log(`Recalculated ${count} attention scores`);
    }
    const view = await getLighthouseView();
    return reply.send(view);
  } catch (error) {
    console.error('Lighthouse error:', error);
    return reply.code(500).send({ error: 'Failed to load lighthouse view' });
  }
}

/**
 * POST /api/intake/status-check — create a batch of status check items.
 * One intake item per recipient. Each tracks response status.
 */
export async function createStatusCheckHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = request.body as any;
    if (!body.title?.trim()) {
      return reply.code(400).send({ error: 'Title is required' });
    }
    if (!body.recipients?.length) {
      return reply.code(400).send({ error: 'At least one recipient is required' });
    }
    if (!body.due_date) {
      return reply.code(400).send({ error: 'Due date is required' });
    }
    const user = (request as any).user;
    const result = await createStatusCheckBatch({
      title: body.title,
      description: body.description,
      recipients: body.recipients,
      due_date: body.due_date,
      created_by: user?.id || body.created_by || 1,
    });
    return reply.code(201).send(result);
  } catch (error) {
    console.error('StatusCheck create error:', error);
    return reply.code(500).send({ error: 'Failed to create status check batch' });
  }
}

/**
 * GET /api/intake/status-check — get response summary.
 * Shows who responded vs who hasn't.
 */
export async function getStatusCheckHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const summary = await getStatusCheckSummary();
    return reply.send(summary);
  } catch (error) {
    console.error('StatusCheck get error:', error);
    return reply.code(500).send({ error: 'Failed to get status check summary' });
  }
}
