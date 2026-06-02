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
  | 'PAYMENT_RECEIVED'
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
  schoolPhone?: string;
  athleticDirectorName?: string;
  athleticDirectorEmail?: string;
  athleticDirectorPhone?: string;
  headCoachName?: string;
  headCoachEmail?: string;
  headCoachPhone?: string;
  coverageStatus: CoverageStatus;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  pipelineValue: number;
  status: 'ACTIVE' | 'WATCH' | 'NEW';
  nextAction: string;
  lastActivity: string;
  leadTier?: 'TIER_1' | 'TIER_2' | 'TIER_3' | 'UNASSIGNED';
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

export const opportunityStages: OpportunityStage[] = ['LEAD_ASSIGNED', 'CONTACTED', 'DISCOVERY', 'MOCKUP_REQUESTED', 'MOCKUP_DELIVERED', 'INVOICE_SENT', 'DECISION_PENDING', 'PAYMENT_RECEIVED', 'CLOSED_WON', 'CLOSED_LOST'];

export const teamMembers: TeamMember[] = [
  { id: 'u-owner-coach-bradshaw', name: 'Coach Bradshaw', role: 'OWNER', territoryIds: ['metro', 'north', 'west', 'south'], active: true },
  { id: 'u-director-primeau-hill', name: 'Primeau Hill', role: 'DIRECTOR', territoryIds: ['west'], active: true },
];

// Mock operational records were removed. Runtime lists now come from imported/local/API-backed records only.
export const organizations: Organization[] = [];
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
