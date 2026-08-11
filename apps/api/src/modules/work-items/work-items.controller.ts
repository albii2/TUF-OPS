import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  listWorkItems,
  createWorkItem,
  updateWorkItem,
  updateWorkItemStatus,
} from './work-items.service';
import type { CreateWorkItemInput, UpdateWorkItemInput, UpdateWorkItemStatusInput } from './work-items.service';

export async function listWorkItemsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { owner_id, status, source, priority, linked_entity_type, linked_entity_id } =
      request.query as any;

    const items = await listWorkItems({
      owner_id: owner_id !== undefined ? Number(owner_id) : undefined,
      status,
      source,
      priority,
      linked_entity_type,
      linked_entity_id: linked_entity_id !== undefined ? Number(linked_entity_id) : undefined,
    });
    return reply.send(items);
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: error?.message || 'Failed to list work items' });
  }
}

export async function createWorkItemHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const input = request.body as CreateWorkItemInput;
    if (!input.source?.trim() || !input.item_type?.trim() || !input.title?.trim()) {
      return reply.code(400).send({ error: 'source, item_type, and title are required' });
    }
    const item = await createWorkItem(input);
    return reply.code(201).send(item);
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: error?.message || 'Failed to create work item' });
  }
}

export async function updateWorkItemHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const input = request.body as UpdateWorkItemInput;
    const item = await updateWorkItem(Number(id), input);
    if (!item) return reply.code(404).send({ error: 'Work item not found' });
    return reply.send(item);
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: error?.message || 'Failed to update work item' });
  }
}

export async function updateWorkItemStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const input = request.body as UpdateWorkItemStatusInput;
    if (!input.status?.trim()) {
      return reply.code(400).send({ error: 'status is required' });
    }
    const item = await updateWorkItemStatus(Number(id), input);
    if (!item) return reply.code(404).send({ error: 'Work item not found' });
    return reply.send(item);
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: error?.message || 'Failed to update work item status' });
  }
}
