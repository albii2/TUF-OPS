import { apiClient } from './apiClient';
export async function getCandidates(params) {
    const query = {};
    if (params?.stage && params.stage !== 'ALL')
        query.stage = params.stage;
    if (params?.director_id)
        query.director_id = String(params.director_id);
    if (params?.search)
        query.search = params.search;
    return apiClient('/recruiting', { query });
}
export async function getCandidate(id) {
    return apiClient(`/recruiting/${id}`);
}
export async function createCandidate(input) {
    return apiClient('/recruiting', { method: 'POST', body: input });
}
export async function updateCandidate(id, input) {
    return apiClient(`/recruiting/${id}`, { method: 'PUT', body: input });
}
export async function getCandidateActivities(id) {
    return apiClient(`/recruiting/${id}/activities`);
}
export async function getRecruitingDashboard(directorId) {
    const query = {};
    if (directorId)
        query.director_id = String(directorId);
    return apiClient('/recruiting/dashboard', { query });
}
export { STAGE_ORDER as STAGES, STAGE_LABELS } from '@tuf/shared';
export const STAGE_COLORS = {
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
//# sourceMappingURL=recruitingService.js.map