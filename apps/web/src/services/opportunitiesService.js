import { opportunityStages } from '@tuf/shared';
import { REVENUE_LANES as revenueLanes } from '../config/business';
import { apiClient } from './apiClient';
export const nextActionByStage = {
    LEAD_ENGAGED: 'Contact coach and confirm decision owner',
    DISCOVERY: 'Request mockup with sport and season notes',
    MOCKUP_STAGE: 'Send invoice and confirm package',
    INVOICE_SENT: 'Follow up payment timing',
    CLOSED_WON: 'Review order handoff',
    CLOSED_LOST: 'Review loss reason',
    LEAD_ASSIGNED: 'Contact coach and confirm decision owner',
    CONTACTED: 'Log discovery notes',
    MOCKUP_REQUESTED: 'Confirm mockup delivery date',
    MOCKUP_DELIVERED: 'Send invoice and confirm package',
    DECISION_PENDING: 'Push decision and confirm payment commitment',
    PAYMENT_RECEIVED: 'Start order handoff and final close checklist',
};
function normalizeApiOpportunity(raw) {
    const stage = raw.stage || 'lead';
    return {
        id: String(raw.id),
        title: raw.name || '',
        organizationId: String(raw.organization_id || ''),
        organizationName: raw.organization_name || raw.organization?.name || '',
        lanes: raw.lane ? [raw.lane] : [],
        sport: raw.sport || '',
        season: raw.season || '',
        stage,
        value: raw.value || raw.estimated_value || 0,
        assignedRep: raw.assigned_rep_name || raw.assigned_rep || 'Unassigned',
        assignedDirector: raw.assigned_director_name || raw.assigned_director || 'Unassigned',
        estimatedValue: raw.estimated_value || raw.value || 0,
        nextAction: raw.next_action || 'Review opportunity details',
        closeProbability: raw.close_probability || raw.probability || 50,
        lastActivity: raw.updated_at ? raw.updated_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        createdAt: raw.created_at || new Date().toISOString(),
    };
}
export async function listOpportunities(params = {}) {
    const query = {};
    if (params.search)
        query.search = params.search;
    if (params.stage && params.stage !== 'ALL')
        query.stage = params.stage;
    if (params.lane && params.lane !== 'ALL')
        query.lane = params.lane;
    if (params.rep)
        query.rep = params.rep;
    if (params.sport)
        query.sport = params.sport;
    const raw = await apiClient('/opportunities', { query });
    return (raw || []).filter(Boolean).map(normalizeApiOpportunity);
}
export async function createOpportunity(input) {
    return apiClient('/opportunities', {
        method: 'POST',
        body: input,
    });
}
export async function updateOpportunity(id, patch) {
    return apiClient(`/opportunities/${id}`, { method: 'PUT', body: patch });
}
export async function deleteOpportunity(id) {
    await apiClient(`/opportunities/${id}`, { method: 'DELETE' });
    return true;
}
export async function addOpportunityLane(id, lane) {
    const opp = await getOpportunityById(id);
    if (!opp)
        return undefined;
    if (opp.lanes.includes(lane))
        return opp;
    return updateOpportunity(id, { lanes: [...opp.lanes, lane] });
}
export async function removeOpportunityLane(id, lane) {
    const opp = await getOpportunityById(id);
    if (!opp)
        return undefined;
    if (!opp.lanes.includes(lane))
        return opp;
    return updateOpportunity(id, { lanes: opp.lanes.filter((l) => l !== lane) });
}
export async function logOpportunityActivity(id, message) {
    return updateOpportunity(id, { nextAction: message });
}
export async function updateOpportunityStage(id, stage) {
    return updateOpportunity(id, { stage });
}
export function getOpportunityStages() {
    return opportunityStages;
}
export function getRevenueLanes() {
    return revenueLanes;
}
export async function getOpportunityById(id) {
    try {
        return await apiClient(`/opportunities/${id}`);
    }
    catch {
        return undefined;
    }
}
// Backward-compat: sync stub for callers that still use non-awaited getOpportunityById
// All callers should migrate to the async version above
//# sourceMappingURL=opportunitiesService.js.map