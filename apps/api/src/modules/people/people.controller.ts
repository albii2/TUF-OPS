import { FastifyReply, FastifyRequest } from 'fastify';
import { getPipelineCandidates, createPipelineCandidate, advancePipelineStage, getPipelineStats } from './people.service';

export async function listHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const filters = (request.query as any) || {};
    const candidates = await getPipelineCandidates(filters);
    return reply.send({ candidates });
  } catch (e) { return reply.code(500).send({ error: 'Failed to fetch pipeline' }); }
}

export async function createHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = request.body as any;
    if (!body.candidate_name?.trim()) return reply.code(400).send({ error: 'Name required' });
    const user = (request as any).user;
    const candidate = await createPipelineCandidate({ ...body, created_by: user?.id || body.created_by });
    return reply.code(201).send({ candidate });
  } catch (e) { return reply.code(500).send({ error: 'Failed to create' }); }
}

export async function advanceHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const { stage, notes } = request.body as any;
    if (!stage) return reply.code(400).send({ error: 'Stage required' });
    const candidate = await advancePipelineStage(Number(request.params.id), stage, notes);
    return reply.send({ candidate });
  } catch (e) { return reply.code(500).send({ error: 'Failed to advance' }); }
}

export async function statsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const stats = await getPipelineStats();
    return reply.send({ stats });
  } catch (e) { return reply.code(500).send({ error: 'Failed to fetch stats' }); }
}
