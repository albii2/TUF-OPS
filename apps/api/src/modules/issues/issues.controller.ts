import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  listIssues,
  createIssue,
  updateIssue,
  updateIssueStatus,
  getIssueById,
} from './issues.service';
import type { CreateIssueInput, UpdateIssueInput, UpdateIssueStatusInput } from './issues.interface';

export async function listIssuesHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { status, severity, category, submitted_by, assigned_to, is_blocking } =
      request.query as Record<string, string>;

    const items = await listIssues({
      status: status as any,
      severity: severity as any,
      category: category as any,
      submitted_by: submitted_by !== undefined ? Number(submitted_by) : undefined,
      assigned_to: assigned_to !== undefined ? Number(assigned_to) : undefined,
      is_blocking: is_blocking !== undefined ? is_blocking === 'true' : undefined,
    });
    return reply.send({ items });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: error?.message || 'Failed to list issues' });
  }
}

export async function getIssueHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  try {
    const item = await getIssueById(Number(request.params.id));
    if (!item) return reply.code(404).send({ error: 'Issue not found' });
    return reply.send({ item });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: error?.message || 'Failed to fetch issue' });
  }
}

export async function createIssueHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const input = request.body as CreateIssueInput;
    if (!input.title?.trim()) {
      return reply.code(400).send({ error: 'Title is required' });
    }
    const user = (request as any).currentUser;
    if (!user?.id) {
      return reply.code(401).send({ error: 'Authentication required' });
    }
    const item = await createIssue(input, user.id);
    return reply.code(201).send({ item });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: error?.message || 'Failed to create issue' });
  }
}

export async function updateIssueHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  try {
    const input = request.body as UpdateIssueInput;
    const item = await updateIssue(Number(request.params.id), input);
    if (!item) return reply.code(404).send({ error: 'Issue not found' });
    return reply.send({ item });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: error?.message || 'Failed to update issue' });
  }
}

export async function updateIssueStatusHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  try {
    const input = request.body as UpdateIssueStatusInput;
    if (!input.status?.trim()) {
      return reply.code(400).send({ error: 'Status is required' });
    }
    const item = await updateIssueStatus(Number(request.params.id), input);
    if (!item) return reply.code(404).send({ error: 'Issue not found' });
    return reply.send({ item });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: error?.message || 'Failed to update issue status' });
  }
}
