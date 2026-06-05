import { REVENUE_LANES as revenueLanes } from '../config/business';

export type RevenueLane = 'UNIFORM' | 'TRAVEL_GEAR' | 'TEAM_STORE' | 'LETTERMAN';
export type LaneStatus = 'OPEN' | 'ACTIVE' | 'WON' | 'LOST';
export type OpportunityStage =
  | 'LEAD_ASSIGNED'
  | 'CONTACTED'
  | 'DISCOVERY'
  | 'MOCKUP_REQUESTED'
  | 'MOCKUP_DELIVERED'
  | 'INVOICE_SENT'
  | 'DECISION_PENDING'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';

export type CoverageStatus = 'UNTOUCHED' | 'CONTACTED' | 'ACTIVE' | 'CLOSED';
export type TerritoryId = 'metro' | 'north' | 'west' | 'south';

export type TeamMember = {
  id: string;
  name: string;
  role: 'OWNER' | 'DIRECTOR' | 'REP' | 'OPS';
  territoryIds: TerritoryId[];
  active: boolean;
};

export type Organization = {
  id: string;
  name: string;
  city: string;
  state: string;
  assignedRep: string;
  assignedDirector: string;
  territory: TerritoryId;
  coverageStatus: CoverageStatus;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  pipelineValue: number;
  status: 'ACTIVE' | 'WATCH' | 'NEW';
  nextAction: string;
  lastActivity: string;
  laneStatuses: Record<RevenueLane, { status: LaneStatus; estimatedValue: number; activeOpportunityCount: number; nextAction: string }>;
  expansionRecommendation: string;
};

export type Opportunity = {
  id: string;
  title: string;
  organizationId: string;
  organizationName: string;
  lane: RevenueLane;
  sport: string;
  season: string;
  stage: OpportunityStage;
  value: number;
  assignedRep: string;
  nextAction: string;
  lastActivity: string;
  closeProbability: number;
};

export type Order = {
  id: string;
  organizationId: string;
  organizationName: string;
  opportunityId: string;
  lane: RevenueLane;
  value: number;
  productionStatus: 'NEEDS_REVIEW' | 'READY_FOR_VENDOR' | 'IN_PRODUCTION' | 'BLOCKED' | 'COMPLETED';
  missingInfo: string[];
  vendor: string;
  createdDate: string;
  vendorNotes: string;
};

export type Activity = {
  id: string;
  entityType: 'ORGANIZATION' | 'OPPORTUNITY' | 'ORDER';
  entityId: string;
  message: string;
  timestamp: string;
  user: string;
};

export const opportunityStages: OpportunityStage[] = [
  'LEAD_ASSIGNED',
  'CONTACTED',
  'DISCOVERY',
  'MOCKUP_REQUESTED',
  'MOCKUP_DELIVERED',
  'INVOICE_SENT',
  'DECISION_PENDING',
  'CLOSED_WON',
  'CLOSED_LOST',
];

export const teamMembers: TeamMember[] = [
  { id: 'u-owner', name: 'Coach Bradshaw', role: 'OWNER', territoryIds: ['metro', 'north', 'west', 'south'], active: true },
  { id: 'u-primeau-director', name: 'Primeau Hill Director', role: 'DIRECTOR', territoryIds: ['north', 'west'], active: true },
  { id: 'u-test-director', name: 'Test Director', role: 'DIRECTOR', territoryIds: ['metro'], active: true },
  { id: 'u-test-rep', name: 'Test Rep', role: 'REP', territoryIds: ['metro'], active: true },
];

const emptyLaneStatuses: Record<RevenueLane, { status: LaneStatus; estimatedValue: number; activeOpportunityCount: number; nextAction: string }> = {
  UNIFORM: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Confirm program needs' },
  TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Identify travel season' },
  TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Confirm store owner' },
  LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Review senior interest' },
};

export const organizations: Organization[] = [
  {
    id: 'org-test-1',
    name: 'TUF Test Academy',
    city: 'Minneapolis',
    state: 'MN',
    assignedRep: 'Test Rep',
    assignedDirector: 'Test Director',
    territory: 'metro',
    coverageStatus: 'ACTIVE',
    priority: 'HIGH',
    pipelineValue: 15000,
    status: 'ACTIVE',
    nextAction: 'Advance the controlled test opportunity',
    lastActivity: '2026-06-01',
    expansionRecommendation: 'Use this controlled account for internal role and routing smoke tests only.',
    laneStatuses: {
      ...emptyLaneStatuses,
      UNIFORM: { status: 'ACTIVE', estimatedValue: 15000, activeOpportunityCount: 1, nextAction: 'Move discovery to mockup request' },
    },
  },
  {
    id: 'org-primeau-1',
    name: 'Primeau Hill Athletics',
    city: 'St. Paul',
    state: 'MN',
    assignedRep: 'Unassigned',
    assignedDirector: 'Primeau Hill Director',
    territory: 'north',
    coverageStatus: 'UNTOUCHED',
    priority: 'MEDIUM',
    pipelineValue: 0,
    status: 'NEW',
    nextAction: 'Assign rep coverage before adding opportunities',
    lastActivity: '2026-06-01',
    expansionRecommendation: 'Baseline director account retained for internal rollout verification.',
    laneStatuses: emptyLaneStatuses,
  },
];

export const opportunities: Opportunity[] = [
  {
    id: 'opp-test-1',
    title: 'Varsity Football FA26 - Uniform',
    organizationId: 'org-test-1',
    organizationName: 'TUF Test Academy',
    lane: 'UNIFORM',
    sport: 'Football',
    season: 'FA26',
    stage: 'CONTACTED',
    value: 15000,
    assignedRep: 'Test Rep',
    nextAction: 'Log discovery notes',
    lastActivity: '2026-06-01',
    closeProbability: 30,
  },
];

export const orders: Order[] = [];

export const activities: Activity[] = [
  {
    id: 'act-test-1',
    entityType: 'OPPORTUNITY',
    entityId: 'opp-test-1',
    message: 'Controlled smoke-test opportunity created for role verification.',
    timestamp: '2026-06-01T10:00:00Z',
    user: 'Coach Bradshaw',
  },
];

export const reportsSummary = {
  weeklySummary: {
    pipelineAdded: opportunities.reduce((sum, opportunity) => sum + opportunity.value, 0),
    closedWon: 0,
    newOrganizations: organizations.filter((organization) => organization.status === 'NEW').length,
    blockedOrders: 0,
  },
  monthlySummary: {
    pipelineTotal: opportunities.reduce((sum, opportunity) => sum + opportunity.value, 0),
    closedWon: 0,
    winRate: 0,
    averageDeal: opportunities.length ? opportunities.reduce((sum, opportunity) => sum + opportunity.value, 0) / opportunities.length : 0,
  },
  lanePerformance: revenueLanes.map((lane) => ({
    lane,
    pipeline: opportunities.filter((opportunity) => opportunity.lane === lane).reduce((sum, opportunity) => sum + opportunity.value, 0),
    won: 0,
    winRate: 0,
  })),
  repPerformance: teamMembers
    .filter((member) => member.role === 'REP' && member.active)
    .map((rep) => ({
      rep: rep.name,
      pipeline: opportunities.filter((opportunity) => opportunity.assignedRep === rep.name).reduce((sum, opportunity) => sum + opportunity.value, 0),
      won: 0,
      openDeals: opportunities.filter((opportunity) => opportunity.assignedRep === rep.name && !['CLOSED_WON', 'CLOSED_LOST'].includes(opportunity.stage)).length,
    })),
};

export const opsWorkspaceQueue = {
  NEEDS_REVIEW: [] as Order[],
  READY_FOR_VENDOR: [] as Order[],
  IN_PRODUCTION: [] as Order[],
  BLOCKED: [] as Order[],
  COMPLETED: [] as Order[],
};
