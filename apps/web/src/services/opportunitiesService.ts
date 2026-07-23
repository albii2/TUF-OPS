import { opportunityStages } from '@tuf/shared';
import type { Opportunity, OpportunityStage, RevenueLane } from '@tuf/shared';
import { REVENUE_LANES as revenueLanes } from '../config/business';
import { apiClient } from './apiClient';

export type OpportunityListParams = {
  search?: string;
  stage?: 'ALL' | OpportunityStage;
  lane?: 'ALL' | RevenueLane;
  rep?: string;
  sport?: string;
  refreshKey?: number;
};

export const nextActionByStage: Record<OpportunityStage, string> = {
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

function normalizeApiOpportunity(raw: any): Opportunity {
  const stage = raw.stage || 'lead';
  // Map canonical lowercase stages to legacy display stages for frontend compatibility
  const stageMap: Record<string, string> = {
    lead: 'LEAD_ENGAGED',
    contacted: 'CONTACTED',
    proposal_sent: 'DISCOVERY',
    negotiation: 'MOCKUP_STAGE',
    order_assembly: 'INVOICE_SENT',
    director_qa: 'DECISION_PENDING',
    closed_won: 'CLOSED_WON',
    closed_lost: 'CLOSED_LOST',
    ready_for_operations: 'READY_FOR_OPS',
    in_production: 'IN_PRODUCTION',
    quality_control: 'QUALITY_CONTROL',
    shipped: 'SHIPPED',
    delivered: 'DELIVERED',
    lead_engaged: 'LEAD_ENGAGED',
    discovery: 'DISCOVERY',
    mockup_stage: 'MOCKUP_STAGE',
    invoice_sent: 'INVOICE_SENT',
  };
  const displayStage = stageMap[stage.toLowerCase()] || stage;
  return {
    id: String(raw.id),
    title: raw.name || '',
    organizationId: String(raw.organization_id || ''),
    organizationName: raw.organization_name || raw.organization?.name || '',
    lanes: raw.lanes ?? (raw.channel_type ? [raw.channel_type] : raw.lane ? [raw.lane] : []),
    sport: raw.sport || '',
    season: raw.season || '',
    stage: displayStage as Opportunity['stage'],
    value: Number(raw.value) || Number(raw.estimated_value) || 0,
    assignedRep: raw.assigned_rep_name || raw.assigned_rep || 'Unassigned',
    assignedDirector: raw.assigned_director_name || raw.assigned_director || 'Unassigned',
    estimatedValue: Number(raw.estimated_value) || Number(raw.value) || 0,
    nextAction: raw.next_action || 'Review opportunity details',
    closeProbability: raw.close_probability || raw.probability || 50,
    lastActivity: raw.updated_at ? raw.updated_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
    createdAt: raw.created_at || new Date().toISOString(),
  } as Opportunity;
}

export async function listOpportunities(params: OpportunityListParams = {}): Promise<Opportunity[]> {
  const query: Record<string, string | undefined> = {};
  if (params.search) query.search = params.search;
  if (params.stage && params.stage !== 'ALL') query.stage = params.stage;
  if (params.lane && params.lane !== 'ALL') query.lane = params.lane;
  if (params.rep) query.rep = params.rep;
  if (params.sport) query.sport = params.sport;
  const raw = await apiClient<any[]>('/opportunities', { query });
  return (raw || []).filter(Boolean).map(normalizeApiOpportunity);
}

export async function createOpportunity(input: {
  name?: string;
  organizationId: string;
  organizationName: string;
  programLevel: string;
  sport: string;
  seasonCode: string;
  lane: RevenueLane;
  assignedRep: string;
  value: number;
  organizationAssignedDirector?: string;
}): Promise<Opportunity> {
  return apiClient<Opportunity>('/opportunities', {
    method: 'POST',
    body: input,
  });
}

export async function updateOpportunity(
  id: string,
  patch: Partial<Opportunity>,
): Promise<Opportunity> {
  return apiClient<Opportunity>(`/opportunities/${id}`, { method: 'PUT', body: patch });
}

export async function deleteOpportunity(id: string): Promise<boolean> {
  await apiClient(`/opportunities/${id}`, { method: 'DELETE' });
  return true;
}

export async function addOpportunityLane(id: string, lane: RevenueLane): Promise<Opportunity | undefined> {
  const opp = await getOpportunityById(id);
  if (!opp) return undefined;
  if (opp.lanes.includes(lane)) return opp;
  return updateOpportunity(id, { lanes: [...opp.lanes, lane] } as any);
}

export async function removeOpportunityLane(id: string, lane: RevenueLane): Promise<Opportunity | undefined> {
  const opp = await getOpportunityById(id);
  if (!opp) return undefined;
  if (!opp.lanes.includes(lane)) return opp;
  return updateOpportunity(id, { lanes: opp.lanes.filter((l) => l !== lane) } as any);
}

export async function logOpportunityActivity(id: string, message: string): Promise<Opportunity | undefined> {
  return updateOpportunity(id, { nextAction: message } as any);
}

export async function updateOpportunityStage(id: string, stage: OpportunityStage): Promise<Opportunity | undefined> {
  const raw = await apiClient<any>(`/opportunities/${id}/stage`, { method: 'PUT', body: { stage } });
  if (!raw) return undefined;
  return normalizeApiOpportunity(raw);
}

export function getOpportunityStages() {
  return opportunityStages;
}

export function getRevenueLanes() {
  return revenueLanes;
}

export async function getOpportunityById(id: string): Promise<Opportunity | undefined> {
  try {
    const raw = await apiClient<any>(`/opportunities/${id}`);
    if (!raw) return undefined;
    return normalizeApiOpportunity(raw);
  } catch {
    return undefined;
  }
}

// Backward-compat: sync stub for callers that still use non-awaited getOpportunityById
// All callers should migrate to the async version above
