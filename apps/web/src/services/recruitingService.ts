import { apiClient } from './apiClient';

export interface Candidate {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  source: string;
  stage: string;
  assigned_director_id: number | null;
  territory_id: number | null;
  resume_url: string | null;
  notes: string | null;
  interview_date: string | null;
  interview_scorecard: Record<string, number> | null;
  offer_details: Record<string, unknown> | null;
  certification_progress: Record<string, number> | null;
  user_id: number | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateActivity {
  id: number;
  candidate_id: number;
  type: string;
  description: string | null;
  created_by: number | null;
  created_at: string;
}

export interface RecruitingDashboard {
  stages: { stage: string; count: number }[];
  academy: { id: number; name: string; progress: Record<string, number> }[];
}

export interface CreateCandidateInput {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  source?: string;
  notes?: string;
  assigned_director_id?: number;
}

export async function getCandidates(params?: {
  stage?: string;
  director_id?: number;
  search?: string;
}): Promise<Candidate[]> {
  const query: Record<string, string | undefined> = {};
  if (params?.stage && params.stage !== 'ALL') query.stage = params.stage;
  if (params?.director_id) query.director_id = String(params.director_id);
  if (params?.search) query.search = params.search;
  return apiClient<Candidate[]>('/recruiting', { query });
}

export async function getCandidate(id: number): Promise<Candidate> {
  return apiClient<Candidate>(`/recruiting/${id}`);
}

export async function createCandidate(input: CreateCandidateInput): Promise<Candidate> {
  return apiClient<Candidate>('/recruiting', { method: 'POST', body: input });
}

export async function updateCandidate(id: number, input: Partial<Candidate>): Promise<Candidate> {
  return apiClient<Candidate>(`/recruiting/${id}`, { method: 'PUT', body: input });
}

export async function getCandidateActivities(id: number): Promise<CandidateActivity[]> {
  return apiClient<CandidateActivity[]>(`/recruiting/${id}/activities`);
}

export async function getRecruitingDashboard(directorId?: number): Promise<RecruitingDashboard> {
  const query: Record<string, string | undefined> = {};
  if (directorId) query.director_id = String(directorId);
  return apiClient<RecruitingDashboard>('/recruiting/dashboard', { query });
}

export const STAGES = [
  'applied', 'screening', 'interview_scheduled', 'interview_complete',
  'offer_extended', 'offer_accepted', 'activated', 'academy',
  'certified', 'territory_assigned', 'active_tae', 'rejected',
] as const;

export const STAGE_LABELS: Record<string, string> = {
  applied: 'Applied',
  screening: 'Screening',
  interview_scheduled: 'Interview Scheduled',
  interview_complete: 'Interview Complete',
  offer_extended: 'Offer Extended',
  offer_accepted: 'Offer Accepted',
  activated: 'Activated',
  academy: 'Academy',
  certified: 'Certified',
  territory_assigned: 'Territory Assigned',
  active_tae: 'Active TAE',
  rejected: 'Rejected',
};

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
