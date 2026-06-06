import { opportunities, type Opportunity, opportunityStages, type OpportunityStage, type RevenueLane } from '../data/mockSalesData';
import { REVENUE_LANES as revenueLanes } from '../config/business';
import { getStoredUser } from '../auth';
import { buildOpportunityDisplayName } from '../utils/naming';
import { DATA_MODE } from './dataMode';
import { canAdvanceOpportunity, canViewOpportunity, getAdvanceDeniedMessage, getDirectorRepSet } from './roleScope';

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

const nextActionByStage: Record<OpportunityStage, string> = {
  LEAD_ASSIGNED: 'Contact decision maker',
  CONTACTED: 'Log discovery notes',
  DISCOVERY: 'Request mockup with sport and season notes',
  MOCKUP_REQUESTED: 'Confirm mockup delivery date',
  MOCKUP_DELIVERED: 'Send invoice and confirm package',
  INVOICE_SENT: 'Follow up payment timing',
  DECISION_PENDING: 'Push decision and confirm payment commitment',
  PAYMENT_RECEIVED: 'Start order handoff and final close checklist',
  CLOSED_WON: 'Review order handoff',
  CLOSED_LOST: 'Review loss reason',
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

function getAllOpportunities() {
  const localRows = readLocalOpportunities();
  const legacyRows = readLegacyOpportunities();
  const persistedRows = [...localRows, ...legacyRows];
  const persistedIds = new Set(persistedRows.map((row) => row.id));
  return [...persistedRows, ...opportunities.filter((row) => !persistedIds.has(row.id))];
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function resolveAssignedDirector(input: { assignedRep: string; organizationAssignedDirector?: string }) {
  const user = getStoredUser();
  if (user?.role === 'DIRECTOR') return user.name;
  if (input.organizationAssignedDirector && input.organizationAssignedDirector !== 'Unassigned') return input.organizationAssignedDirector;
  const matchingDirector = ['Test Director', 'Primeau Hill Director'].find((director) => getDirectorRepSet(director).has(input.assignedRep));
  return matchingDirector ?? '';
}

export function listOpportunities(params: OpportunityListParams = {}): Opportunity[] {
  if (DATA_MODE !== 'mock') return [];

  return getAllOpportunities().filter((opp) => {
    const matchesSearch = (params.search ?? '').trim()
      ? [opp.title, opp.organizationName].join(' ').toLowerCase().includes((params.search ?? '').toLowerCase())
      : true;
    const matchesStage = !params.stage || params.stage === 'ALL' || opp.stage === params.stage;
    const matchesLane = !params.lane || params.lane === 'ALL' || opp.lane === params.lane;
    const matchesRep = !params.rep || params.rep === 'ALL' || opp.assignedRep === params.rep;
    const matchesSport = !params.sport || params.sport === 'ALL' || opp.sport === params.sport;
    const roleScoped = canViewOpportunity(opp);
    return matchesSearch && matchesStage && matchesLane && matchesRep && matchesSport && roleScoped;
  });
}

export function getOpportunityById(id: string): Opportunity | undefined {
  if (DATA_MODE !== 'mock') return undefined;
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
  const assignedRep = user?.role === 'REP' ? user.name : input.assignedRep.trim();
  if (!input.organizationId) throw new Error('Organization is required.');
  if (!input.organizationName.trim()) throw new Error('Organization name is required.');
  if (!assignedRep) throw new Error('Assigned rep is required.');
  if (!input.sport.trim()) throw new Error('Sport is required.');
  if (!input.seasonCode.trim()) throw new Error('Season is required.');
  if (input.value < 0) throw new Error('Estimated value cannot be negative.');

  const now = new Date().toISOString();
  const assignedDirector = resolveAssignedDirector({ assignedRep, organizationAssignedDirector: input.organizationAssignedDirector });
  const row: Opportunity = {
    id: `opp-local-${Date.now()}`,
    title: buildOpportunityDisplayName({ programLevel: input.programLevel, sport: input.sport, seasonCode: input.seasonCode, lane: input.lane }),
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    lane: input.lane,
    sport: input.sport,
    season: input.seasonCode,
    stage: 'LEAD_ASSIGNED',
    value: input.value,
    estimatedValue: input.value,
    assignedRep,
    assignedDirector,
    nextAction: nextActionByStage.LEAD_ASSIGNED,
    nextActionDueDate: addDays(1),
    dueDate: addDays(1),
    lastActivity: now,
    createdAt: now,
    updatedAt: now,
    orderId: null,
    closeProbability: 20,
  };
  writeLocalOpportunities([row, ...readLocalOpportunities().filter((opp) => opp.id !== row.id)]);
  return row;
}

export function updateOpportunityStage(id: string, stage: OpportunityStage) {
  const existing = getAllOpportunities().find((opp) => opp.id === id);
  if (!existing) return undefined;
  if (!canAdvanceOpportunity(existing)) throw new Error(getAdvanceDeniedMessage(existing));
  const closeProbabilityByStage: Record<OpportunityStage, number> = {
    LEAD_ASSIGNED: 20,
    CONTACTED: 30,
    DISCOVERY: 40,
    MOCKUP_REQUESTED: 55,
    MOCKUP_DELIVERED: 68,
    INVOICE_SENT: 80,
    DECISION_PENDING: 74,
    PAYMENT_RECEIVED: 92,
    CLOSED_WON: 100,
    CLOSED_LOST: 0,
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
  return updated;
}
