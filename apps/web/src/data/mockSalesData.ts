import { REVENUE_LANES as revenueLanes } from '../config/business';
import type { TeamMember, Organization, Opportunity, Order, Activity } from '@tuf/shared';

export type {
  RevenueLane,
  LaneStatus,
  OpportunityStage,
  CoverageStatus,
  TerritoryId,
  TeamMember,
  Organization,
  Opportunity,
  Order,
  Activity,
} from '@tuf/shared';

export { opportunityStages } from '@tuf/shared';

export const teamMembers: TeamMember[] = [
  { id: 'u-owner-coach-bradshaw', name: 'Coach Bradshaw', role: 'OWNER', territoryIds: ['metro', 'north', 'west', 'south'], active: true },
  { id: 'u-director-primeau-hill', name: 'Primeau Hill Director', role: 'DIRECTOR', territoryIds: ['west'], active: true },
  { id: 'u-test-director-agent', name: 'Test Director', role: 'DIRECTOR', territoryIds: ['north'], active: true },
  { id: 'u-test-rep-agent', name: 'Test Rep', role: 'REP', territoryIds: ['north'], active: true },
];

// Mock operational records were removed except for one controlled baseline account used by internal rollout smoke tests.
export const organizations: Organization[] = [
  {
    id: 'org-test-baseline',
    name: 'TUF Test High School',
    city: 'Minneapolis',
    state: 'MN',
    assignedRep: 'Test Rep',
    assignedDirector: 'Test Director',
    territory: 'north',
    schoolPhone: '555-0100',
    athleticDirectorName: 'Test Athletic Director',
    athleticDirectorEmail: 'ad@test.tuf.local',
    athleticDirectorPhone: '555-0101',
    headCoachName: 'Test Coach',
    headCoachEmail: 'coach@test.tuf.local',
    headCoachPhone: '555-0102',
    coverageStatus: 'UNTOUCHED',
    priority: 'LOW',
    pipelineValue: 0,
    status: 'NEW',
    nextAction: 'Create smoke-test opportunity',
    lastActivity: '2026-06-01',
    leadTier: 'UNASSIGNED',
    laneStatuses: {
      UNIFORM: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Create test opportunity' },
      TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'No smoke-test action needed' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'No smoke-test action needed' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'No smoke-test action needed' },
    },
    expansionRecommendation: 'Controlled smoke-test account. Archive or ignore after rollout validation.',
  },
];
export const opportunities: Opportunity[] = [];
export const orders: Order[] = [];
export const activities: Activity[] = [];

export const reportsSummary = {
  weeklySummary: { pipelineAdded: 0, closedWon: 0, newOrganizations: 0, blockedOrders: 0 },
  monthlySummary: { pipelineTotal: 0, closedWon: 0, winRate: 0, averageDeal: 0 },
  lanePerformance: revenueLanes.map((lane) => ({ lane, pipeline: 0, won: 0, winRate: 0 })),
  repPerformance: [],
};

export const opsWorkspaceQueue = {
  NEEDS_REVIEW: [] as Order[],
  READY_FOR_VENDOR: [] as Order[],
  IN_PRODUCTION: [] as Order[],
  BLOCKED: [] as Order[],
  COMPLETED: [] as Order[],
};
