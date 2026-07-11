import { apiClient } from './apiClient';

export type { Candidate, CandidateActivity, CreateCandidateInput } from '@tuf/shared';

export interface RecruitingDashboard {
  stages: { stage: string; count: number }[];
  academy: { id: number; name: string; progress: Record<string, number> }[];
}

export async function getCandidates(params?: {
  stage?: string;
  director_id?: number;
  search?: string;
}): Promise<import('@tuf/shared').Candidate[]> {
  const query: Record<string, string | undefined> = {};
  if (params?.stage && params.stage !== 'ALL') query.stage = params.stage;
  if (params?.director_id) query.director_id = String(params.director_id);
  if (params?.search) query.search = params.search;
  return apiClient<import('@tuf/shared').Candidate[]>('/recruiting', { query });
}

export async function getCandidate(id: number): Promise<import('@tuf/shared').Candidate> {
  return apiClient<import('@tuf/shared').Candidate>(`/recruiting/${id}`);
}

export async function createCandidate(input: import('@tuf/shared').CreateCandidateInput): Promise<import('@tuf/shared').Candidate> {
  return apiClient<import('@tuf/shared').Candidate>('/recruiting', { method: 'POST', body: input });
}

export async function updateCandidate(id: number, input: Partial<import('@tuf/shared').Candidate>): Promise<import('@tuf/shared').Candidate> {
  return apiClient<import('@tuf/shared').Candidate>(`/recruiting/${id}`, { method: 'PUT', body: input });
}

export async function getCandidateActivities(id: number): Promise<import('@tuf/shared').CandidateActivity[]> {
  return apiClient<import('@tuf/shared').CandidateActivity[]>(`/recruiting/${id}/activities`);
}

export async function getRecruitingDashboard(directorId?: number): Promise<RecruitingDashboard> {
  const query: Record<string, string | undefined> = {};
  if (directorId) query.director_id = String(directorId);
  return apiClient<RecruitingDashboard>('/recruiting/dashboard', { query });
}

export { STAGE_ORDER as STAGES, STAGE_LABELS } from '@tuf/shared';

export const STAGE_COLORS: Record<string, string> = {
  applied: 'bg-gray-600',
  screening: 'bg-blue-600',
  interview_scheduled: 'bg-indigo-600',
  interview_complete: 'bg-purple-600',
  offer_extended: 'bg-yellow-600',
  offer_accepted: 'bg-green-600',
  activated: 'bg-teal-600',
  academy: 'bg-cyan-600',
  certified: 'bg-emerald-600',
  territory_assigned: 'bg-lime-600',
  active_tae: 'bg-green-500',
  rejected: 'bg-red-600',
};
