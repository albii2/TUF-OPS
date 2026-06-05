import { opportunities, type Opportunity, opportunityStages, type OpportunityStage, type RevenueLane } from '../data/mockSalesData';
import { REVENUE_LANES as revenueLanes } from '../config/business';
import { DATA_MODE } from './dataMode';
import { buildOpportunityDisplayName } from '../utils/naming';
import { canAdvanceOpportunity, canViewOpportunity, getAdvanceDeniedMessage } from './roleScope';
import { getStoredUser } from '../auth';

export type OpportunityListParams = {
  search?: string;
  stage?: 'ALL' | OpportunityStage;
  lane?: 'ALL' | RevenueLane;
  rep?: string;
  sport?: string;
  refreshKey?: number;
};

const LOCAL_OPPORTUNITIES_KEY = 'tuf_ops_mock_opportunities_v1';

const nextActionByStage: Record<OpportunityStage, string> = {
  LEAD_ASSIGNED: 'Contact coach and confirm decision owner',
  CONTACTED: 'Log discovery notes',
  DISCOVERY: 'Request mockup with sport and season notes',
  MOCKUP_REQUESTED: 'Confirm mockup delivery date',
  MOCKUP_DELIVERED: 'Send invoice and confirm package',
  INVOICE_SENT: 'Follow up payment timing',
  DECISION_PENDING: 'Push decision and next production step',
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

function writeLocalOpportunities(rows: Opportunity[]) {
  localStorage.setItem(LOCAL_OPPORTUNITIES_KEY, JSON.stringify(rows));
}

function getAllOpportunities() {
  const localRows = readLocalOpportunities();
  const localIds = new Set(localRows.map((row) => row.id));
  return [...localRows, ...opportunities.filter((row) => !localIds.has(row.id))];
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
    stage: 'LEAD_ASSIGNED',
    value: input.value,
    assignedRep,
    nextAction: nextActionByStage.LEAD_ASSIGNED,
    lastActivity: new Date().toISOString().slice(0, 10),
    closeProbability: 20,
  };
  writeLocalOpportunities([row, ...readLocalOpportunities()]);
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
    CLOSED_WON: 100,
    CLOSED_LOST: 0,
  };
  const updated: Opportunity = {
    ...existing,
    stage,
    nextAction: nextActionByStage[stage],
    closeProbability: closeProbabilityByStage[stage],
    lastActivity: new Date().toISOString().slice(0, 10),
  };
  writeLocalOpportunities([updated, ...readLocalOpportunities().filter((opp) => opp.id !== id)]);
  return updated;
}
