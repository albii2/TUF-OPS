import { opportunities, type Opportunity, opportunityStages, type OpportunityStage, type RevenueLane } from '../data/mockSalesData';
import { REVENUE_LANES as revenueLanes } from '../config/business';
import { getStoredUser } from '../auth';
import { buildOpportunityDisplayName } from '../utils/naming';
import { DATA_MODE } from './dataMode';
import { getOrganizationById } from './organizationsService';
import { canAdvanceOpportunity, canViewOpportunity, getAdvanceDeniedMessage } from './roleScope';
import { createActivity } from './activitiesService';

export type OpportunityListParams = {
  search?: string;
  stage?: 'ALL' | OpportunityStage;
  lane?: 'ALL' | RevenueLane;
  rep?: string;
  sport?: string;
  refreshKey?: number;
};

const LOCAL_OPPORTUNITIES_KEY = 'tuf_ops_opportunities_v2';
const LEGACY_OPPORTUNITIES_KEY = 'tuf_ops_mock_opportunities_v1';
const DELETED_OPPORTUNITIES_KEY = 'tuf_ops_deleted_opportunity_ids_v1';

const nextActionByStage: Record<OpportunityStage, string> = {
  LEAD_ENGAGED: 'Contact coach and confirm decision owner',
  DISCOVERY: 'Request mockup with sport and season notes',
  MOCKUP_STAGE: 'Send invoice and confirm package',
  INVOICE_SENT: 'Follow up payment timing',
  CLOSED_WON: 'Review order handoff',
  CLOSED_LOST: 'Review loss reason',

  // Legacy mappings for backward compatibility:
  LEAD_ASSIGNED: 'Contact coach and confirm decision owner',
  CONTACTED: 'Log discovery notes',
  MOCKUP_REQUESTED: 'Confirm mockup delivery date',
  MOCKUP_DELIVERED: 'Send invoice and confirm package',
  DECISION_PENDING: 'Push decision and confirm payment commitment',
  PAYMENT_RECEIVED: 'Start order handoff and final close checklist',
};

function readLocalOpportunities(): Opportunity[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_OPPORTUNITIES_KEY) || '[]') as Opportunity[];
  } catch {
    return [];
  }
}

function readLegacyOpportunities(): Opportunity[] {
  try {
    return JSON.parse(localStorage.getItem(LEGACY_OPPORTUNITIES_KEY) || '[]') as Opportunity[];
  } catch {
    return [];
  }
}

function writeLocalOpportunities(rows: Opportunity[]) {
  localStorage.setItem(LOCAL_OPPORTUNITIES_KEY, JSON.stringify(rows));
}

function writeLegacyOpportunities(rows: Opportunity[]) {
  localStorage.setItem(LEGACY_OPPORTUNITIES_KEY, JSON.stringify(rows));
}

function readDeletedOpportunityIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DELETED_OPPORTUNITIES_KEY) || '[]') as string[];
  } catch {
    return [];
  }
}

function writeDeletedOpportunityIds(ids: string[]) {
  localStorage.setItem(DELETED_OPPORTUNITIES_KEY, JSON.stringify(Array.from(new Set(ids))));
}

function removeLegacyOpportunity(id: string) {
  const remainingLegacyRows = readLegacyOpportunities().filter((row) => row.id !== id);
  writeLegacyOpportunities(remainingLegacyRows);
}

function getAllOpportunities() {
  const deletedIds = new Set(readDeletedOpportunityIds());
  const localRows = readLocalOpportunities();
  const localIds = new Set(localRows.map((row) => row.id));
  return [...localRows, ...opportunities.filter((row) => !localIds.has(row.id))]
    .filter((row) => !deletedIds.has(row.id));
}

export function listOpportunities(params: OpportunityListParams = {}): Opportunity[] {
  return getAllOpportunities().filter((opp) => {
    const matchesSearch = (params.search ?? '').trim()
      ? [opp.title, opp.organizationName].join(' ').toLowerCase().includes((params.search ?? '').toLowerCase())
      : true;
    const matchesStage = !params.stage || params.stage === 'ALL' || opp.stage === params.stage;
    const matchesLane = !params.lane || params.lane === 'ALL' || opp.lane === params.lane;
    const matchesRep = !params.rep || params.rep === 'ALL' || opp.assignedRep === params.rep;
    const matchesSport = !params.sport || params.sport === 'ALL' || opp.sport === params.sport;
    const roleScoped = canViewOpportunity(opp) || Boolean(getOrganizationById(opp.organizationId));
    return matchesSearch && matchesStage && matchesLane && matchesRep && matchesSport && roleScoped;
  });
}

export function getOpportunityById(id: string): Opportunity | undefined {
  return listOpportunities({}).find((opp) => opp.id === id);
}

export function getOpportunityStages() {
  return opportunityStages;
}

export function getRevenueLanes() {
  return revenueLanes;
}

export function createMockOpportunity(input: {
  organizationId: string;
  organizationName: string;
  programLevel: string;
  sport: string;
  seasonCode: string;
  lane: RevenueLane;
  assignedRep: string;
  value: number;
  organizationAssignedDirector?: string;
}) {
  const user = getStoredUser();
  const assignedRep = user?.role === 'REP' ? user.name : input.assignedRep;
  const row: Opportunity = {
    id: `opp-local-${Date.now()}`,
    title: buildOpportunityDisplayName({ programLevel: input.programLevel, sport: input.sport, seasonCode: input.seasonCode, lane: input.lane }),
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    lane: input.lane,
    sport: input.sport,
    season: input.seasonCode,
    stage: 'LEAD_ENGAGED',
    value: input.value,
    assignedRep,
    nextAction: nextActionByStage.LEAD_ENGAGED,
    lastActivity: new Date().toISOString().slice(0, 10),
    closeProbability: 20,
  };
  writeLocalOpportunities([row, ...readLocalOpportunities().filter((opp) => opp.id !== row.id)]);
  window.dispatchEvent(new CustomEvent('tuf:opportunity-updated', { detail: row }));
  return row;
}

export function updateOpportunityStage(id: string, stage: OpportunityStage) {
  const existing = getAllOpportunities().find((opp) => opp.id === id);
  if (!existing) return undefined;
  if (!canAdvanceOpportunity(existing)) throw new Error(getAdvanceDeniedMessage(existing));
  const closeProbabilityByStage: Record<OpportunityStage, number> = {
    LEAD_ENGAGED: 20,
    DISCOVERY: 40,
    MOCKUP_STAGE: 68,
    INVOICE_SENT: 80,
    CLOSED_WON: 100,
    CLOSED_LOST: 0,
    LEAD_ASSIGNED: 20,
    CONTACTED: 30,
    MOCKUP_REQUESTED: 55,
    MOCKUP_DELIVERED: 68,
    DECISION_PENDING: 74,
    PAYMENT_RECEIVED: 92,
  };
  const updated: Opportunity = {
    ...existing,
    stage,
    nextAction: nextActionByStage[stage],
    closeProbability: closeProbabilityByStage[stage],
    lastActivity: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeLocalOpportunities([updated, ...readLocalOpportunities().filter((opp) => opp.id !== id)]);
  removeLegacyOpportunity(id);
  createActivity({
    entityType: 'OPPORTUNITY',
    entityId: id,
    message: `Stage advanced from ${existing.stage.replace(/_/g, ' ')} to ${stage.replace(/_/g, ' ')}.`,
  });
  window.dispatchEvent(new CustomEvent('tuf:opportunity-updated', { detail: updated }));
  return updated;
}

export function logOpportunityActivity(id: string, message: string) {
  const existing = getAllOpportunities().find((opp) => opp.id === id);
  if (!existing) return undefined;
  const updated: Opportunity = {
    ...existing,
    lastActivity: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nextAction: message || existing.nextAction,
  };
  writeLocalOpportunities([updated, ...readLocalOpportunities().filter((opp) => opp.id !== id)]);
  removeLegacyOpportunity(id);
  createActivity({ entityType: 'OPPORTUNITY', entityId: id, message });
  window.dispatchEvent(new CustomEvent('tuf:opportunity-updated', { detail: updated }));
  return updated;
}

export function deleteOpportunity(id: string) {
  const existing = getAllOpportunities().find((opp) => opp.id === id);
  if (!existing) return false;

  writeLocalOpportunities(readLocalOpportunities().filter((opp) => opp.id !== id));
  removeLegacyOpportunity(id);
  writeDeletedOpportunityIds([...readDeletedOpportunityIds(), id]);
  createActivity({
    entityType: 'ORGANIZATION',
    entityId: existing.organizationId,
    message: `Removed opportunity: ${existing.title}.`,
  });
  window.dispatchEvent(new CustomEvent('tuf:opportunity-updated', { detail: { id, deleted: true } }));
  return true;
}
