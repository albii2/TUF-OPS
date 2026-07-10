import type { FastifyReply, FastifyRequest } from 'fastify';
import { createCandidate, getCandidates, getCandidateById, updateCandidate, setResumeUrl, getCandidateActivities, getRecruitingDashboard } from './recruiting.service';
import type { CreateCandidateInput, UpdateCandidateInput } from './recruiting.interface';

export async function createCandidateHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const input = request.body as CreateCandidateInput;
    if (!input.first_name?.trim() || !input.last_name?.trim() || !input.email?.trim()) {
      return reply.code(400).send({ error: 'First name, last name, and email are required' });
    }
    const candidate = await createCandidate({
      ...input,
      created_by: request.currentUser?.id,
    });
    return reply.code(201).send(candidate);
  } catch (error: any) {
    return reply.code(500).send({ error: error?.message || 'Failed to create candidate' });
  }
}

export async function getCandidatesHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { stage, director_id, search } = request.query as any;
    const candidates = await getCandidates({
      stage,
      director_id: director_id ? Number(director_id) : undefined,
      search,
    });
    return reply.send(candidates);
  } catch (error: any) {
    return reply.code(500).send({ error: error?.message || 'Failed to get candidates' });
  }
}

export async function getCandidateByIdHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const candidate = await getCandidateById(Number(id));
    if (!candidate) return reply.code(404).send({ error: 'Candidate not found' });
    return reply.send(candidate);
  } catch (error: any) {
    return reply.code(500).send({ error: error?.message || 'Failed to get candidate' });
  }
}

export async function updateCandidateHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const input = request.body as UpdateCandidateInput;
    const candidate = await updateCandidate(Number(id), input);
    if (!candidate) return reply.code(404).send({ error: 'Candidate not found' });
    return reply.send(candidate);
  } catch (error: any) {
    return reply.code(500).send({ error: error?.message || 'Failed to update candidate' });
  }
}

export async function uploadResumeHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const data = request.body as any;
    const url = data?.resume_url;
    if (!url) return reply.code(400).send({ error: 'resume_url is required' });
    const candidate = await setResumeUrl(Number(id), url);
    if (!candidate) return reply.code(404).send({ error: 'Candidate not found' });
    return reply.send(candidate);
  } catch (error: any) {
    return reply.code(500).send({ error: error?.message || 'Failed to upload resume' });
  }
}

export async function getCandidateActivitiesHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const activities = await getCandidateActivities(Number(id));
    return reply.send(activities);
  } catch (error: any) {
    return reply.code(500).send({ error: error?.message || 'Failed to get activities' });
  }
}

export async function getRecruitingDashboardHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { director_id } = request.query as any;
    const dashboard = await getRecruitingDashboard(director_id ? Number(director_id) : undefined);
    return reply.send(dashboard);
  } catch (error: any) {
    return reply.code(500).send({ error: error?.message || 'Failed to get dashboard' });
  }
}
