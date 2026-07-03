import { REVENUE_LANES as revenueLanes } from '../config/business';
export type RevenueLane = 'UNIFORM' | 'TRAVEL_GEAR' | 'TEAM_STORE' | 'LETTERMAN';
export type LaneStatus = 'OPEN' | 'ACTIVE' | 'WON' | 'LOST';
export type OpportunityStage =
  | 'LEAD_ENGAGED'
  | 'DISCOVERY'
  | 'MOCKUP_STAGE'
  | 'INVOICE_SENT'
  | 'CLOSED_WON'
  | 'CLOSED_LOST'
  | 'LEAD_ASSIGNED'
  | 'CONTACTED'
  | 'MOCKUP_REQUESTED'
  | 'MOCKUP_DELIVERED'
  | 'DECISION_PENDING'
  | 'PAYMENT_RECEIVED';

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
  lanes: RevenueLane[];
  sport: string;
  season: string;
  stage: OpportunityStage;
  value: number;
  assignedRep: string;
  assignedDirector?: string;
  estimatedValue?: number;
  nextAction: string;
  nextActionDueDate?: string;
  lastActivity: string;
  createdAt?: string;
  updatedAt?: string;
  dueDate?: string;
  orderId?: string | null;
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
  orderStage?: 'ORDER_CREATED' | 'PAYMENT_CONFIRMED' | 'ARTWORK_FINALIZED' | 'VENDOR_READY' | 'IN_PRODUCTION' | 'QUALITY_CHECK' | 'SHIPPED_DELIVERED' | 'COMPLETED' | 'BLOCKED_ON_HOLD';
  previousActiveStage?: 'ORDER_CREATED' | 'PAYMENT_CONFIRMED' | 'ARTWORK_FINALIZED' | 'VENDOR_READY' | 'IN_PRODUCTION' | 'QUALITY_CHECK' | 'SHIPPED_DELIVERED' | 'COMPLETED' | 'BLOCKED_ON_HOLD';
  title?: string;
  sport?: string;
  quantity?: number;
  dueDate?: string;
  assignedRep?: string;
  assignedDirector?: string;
  nextAction?: string;
  nextActionOwner?: string;
  paymentStatus?: string;
  artworkStatus?: string;
  vendorStatus?: string;
  shippingStatus?: string;
  customerContact?: string;
  resolutionDueDate?: string;
  completedDate?: string;
  createdAt?: string;
  updatedAt?: string;
  riskStatus?: 'red' | 'yellow' | 'green' | 'gray';
  activityIds?: string[];
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

export const opportunityStages: OpportunityStage[] = ['LEAD_ENGAGED', 'DISCOVERY', 'MOCKUP_STAGE', 'INVOICE_SENT', 'CLOSED_WON', 'CLOSED_LOST'];

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
export const opportunities: Opportunity[] = [
    { id: "opp-1", title: "Baseball Uniforms", organizationId: "org-86", organizationName: "Eden Prairie HS", sport: "Baseball", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "CLOSED_WON", value: 7992, assignedRep: "Josh Hoffman", nextAction: "Follow up for reorder", createdAt: "2026-07-19", updatedAt: "2026-07-19", lastActivity: "2026-07-19", season: "FALL", closeProbability: 50 },
    { id: "opp-2", title: "Wrestling Uniforms", organizationId: "org-27", organizationName: "Chanhassen HS", sport: "Wrestling", lanes: ["LETTERMAN"] as RevenueLane[], stage: "CLOSED_WON", value: 10136, assignedRep: "Josh Hoffman", nextAction: "Follow up for reorder", createdAt: "2026-07-31", updatedAt: "2026-07-31", lastActivity: "2026-07-31", season: "FALL", closeProbability: 50 },
    { id: "opp-3", title: "7v7 Flag Uniforms", organizationId: "org-24", organizationName: "Apple Valley HS", sport: "7v7 Flag", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "CLOSED_WON", value: 6670, assignedRep: "Josh Hoffman", nextAction: "Follow up for reorder", createdAt: "2026-08-17", updatedAt: "2026-08-17", lastActivity: "2026-08-17", season: "FALL", closeProbability: 50 },
    { id: "opp-4", title: "7v7 Flag Uniforms", organizationId: "org-94", organizationName: "Shakopee HS", sport: "7v7 Flag", lanes: ["LETTERMAN"] as RevenueLane[], stage: "CLOSED_WON", value: 8515, assignedRep: "Josh Hoffman", nextAction: "Follow up for reorder", createdAt: "2026-07-25", updatedAt: "2026-07-25", lastActivity: "2026-07-25", season: "FALL", closeProbability: 50 },
    { id: "opp-5", title: "Hockey Uniforms", organizationId: "org-29", organizationName: "Anoka HS", sport: "Hockey", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "CLOSED_WON", value: 9323, assignedRep: "Josh Hoffman", nextAction: "Follow up for reorder", createdAt: "2026-07-05", updatedAt: "2026-07-05", lastActivity: "2026-07-05", season: "FALL", closeProbability: 50 },
    { id: "opp-6", title: "7v7 Flag Uniforms", organizationId: "org-17", organizationName: "Minnetonka HS", sport: "7v7 Flag", lanes: ["TEAM_STORE"] as RevenueLane[], stage: "CLOSED_WON", value: 5462, assignedRep: "Josh Hoffman", nextAction: "Follow up for reorder", createdAt: "2026-08-09", updatedAt: "2026-08-09", lastActivity: "2026-08-09", season: "FALL", closeProbability: 50 },
    { id: "opp-7", title: "Volleyball Uniforms", organizationId: "org-60", organizationName: "Maple Grove HS", sport: "Volleyball", lanes: ["UNIFORM"] as RevenueLane[], stage: "CLOSED_WON", value: 12098, assignedRep: "Josh Hoffman", nextAction: "Follow up for reorder", createdAt: "2026-07-28", updatedAt: "2026-07-28", lastActivity: "2026-07-28", season: "FALL", closeProbability: 50 },
    { id: "opp-8", title: "7v7 Flag Uniforms", organizationId: "org-77", organizationName: "Shakopee HS", sport: "7v7 Flag", lanes: ["LETTERMAN"] as RevenueLane[], stage: "CLOSED_WON", value: 15581, assignedRep: "Josh Hoffman", nextAction: "Follow up for reorder", createdAt: "2026-08-10", updatedAt: "2026-08-10", lastActivity: "2026-08-10", season: "FALL", closeProbability: 50 },
    { id: "opp-9", title: "Baseball Uniforms", organizationId: "org-33", organizationName: "Bemidji HS", sport: "Baseball", lanes: ["TEAM_STORE"] as RevenueLane[], stage: "CLOSED_WON", value: 6838, assignedRep: "Josh Hoffman", nextAction: "Follow up for reorder", createdAt: "2026-07-10", updatedAt: "2026-07-10", lastActivity: "2026-07-10", season: "FALL", closeProbability: 50 },
    { id: "opp-10", title: "7v7 Flag Uniforms", organizationId: "org-47", organizationName: "Chanhassen HS", sport: "7v7 Flag", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "CLOSED_WON", value: 6433, assignedRep: "Josh Hoffman", nextAction: "Follow up for reorder", createdAt: "2026-07-12", updatedAt: "2026-07-12", lastActivity: "2026-07-12", season: "FALL", closeProbability: 50 },
    { id: "opp-11", title: "7v7 Flag Uniforms", organizationId: "org-40", organizationName: "Wayzata HS", sport: "7v7 Flag", lanes: ["LETTERMAN"] as RevenueLane[], stage: "CLOSED_WON", value: 6774, assignedRep: "Josh Hoffman", nextAction: "Follow up for reorder", createdAt: "2026-07-02", updatedAt: "2026-07-02", lastActivity: "2026-07-02", season: "FALL", closeProbability: 50 },
    { id: "opp-12", title: "Basketball Uniforms", organizationId: "org-81", organizationName: "Roseville HS", sport: "Basketball", lanes: ["LETTERMAN"] as RevenueLane[], stage: "CLOSED_WON", value: 12334, assignedRep: "Josh Hoffman", nextAction: "Follow up for reorder", createdAt: "2026-08-18", updatedAt: "2026-08-18", lastActivity: "2026-08-18", season: "FALL", closeProbability: 50 },
    { id: "opp-13", title: "Volleyball Uniforms", organizationId: "org-6", organizationName: "Stillwater HS", sport: "Volleyball", lanes: ["LETTERMAN"] as RevenueLane[], stage: "MOCKUP_STAGE", value: 7644, assignedRep: "Josh Hoffman", nextAction: "Schedule follow-up", createdAt: "2026-08-10", updatedAt: "2026-08-10", lastActivity: "2026-08-10", season: "FALL", closeProbability: 50 },
    { id: "opp-14", title: "Baseball Uniforms", organizationId: "org-9", organizationName: "Lakeville North", sport: "Baseball", lanes: ["UNIFORM"] as RevenueLane[], stage: "MOCKUP_STAGE", value: 9109, assignedRep: "Josh Hoffman", nextAction: "Schedule follow-up", createdAt: "2026-08-14", updatedAt: "2026-08-14", lastActivity: "2026-08-14", season: "FALL", closeProbability: 50 },
    { id: "opp-15", title: "Basketball Uniforms", organizationId: "org-2", organizationName: "Stillwater HS", sport: "Basketball", lanes: ["TEAM_STORE"] as RevenueLane[], stage: "DISCOVERY", value: 12346, assignedRep: "Josh Hoffman", nextAction: "Schedule follow-up", createdAt: "2026-07-30", updatedAt: "2026-07-30", lastActivity: "2026-07-30", season: "FALL", closeProbability: 50 },
    { id: "opp-16", title: "Baseball Uniforms", organizationId: "org-67", organizationName: "St. Cloud Tech", sport: "Baseball", lanes: ["UNIFORM"] as RevenueLane[], stage: "LEAD_ENGAGED", value: 6121, assignedRep: "Josh Hoffman", nextAction: "Schedule follow-up", createdAt: "2026-08-12", updatedAt: "2026-08-12", lastActivity: "2026-08-12", season: "FALL", closeProbability: 50 },
    { id: "opp-17", title: "Baseball Uniforms", organizationId: "org-26", organizationName: "Minnetonka HS", sport: "Baseball", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "LEAD_ENGAGED", value: 5385, assignedRep: "Josh Hoffman", nextAction: "Schedule follow-up", createdAt: "2026-08-05", updatedAt: "2026-08-05", lastActivity: "2026-08-05", season: "FALL", closeProbability: 50 },
    { id: "opp-18", title: "Football Uniforms", organizationId: "org-21", organizationName: "White Bear Lake HS", sport: "Football", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "LEAD_ENGAGED", value: 9463, assignedRep: "Josh Hoffman", nextAction: "Schedule follow-up", createdAt: "2026-08-15", updatedAt: "2026-08-15", lastActivity: "2026-08-15", season: "FALL", closeProbability: 50 },
    { id: "opp-19", title: "Basketball Uniforms", organizationId: "org-30", organizationName: "White Bear Lake HS", sport: "Basketball", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "INVOICE_SENT", value: 9280, assignedRep: "Josh Hoffman", nextAction: "Schedule follow-up", createdAt: "2026-08-01", updatedAt: "2026-08-01", lastActivity: "2026-08-01", season: "FALL", closeProbability: 50 },
    { id: "opp-20", title: "Volleyball Uniforms", organizationId: "org-49", organizationName: "Rochester Mayo", sport: "Volleyball", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "DISCOVERY", value: 12167, assignedRep: "Josh Hoffman", nextAction: "Schedule follow-up", createdAt: "2026-08-13", updatedAt: "2026-08-13", lastActivity: "2026-08-13", season: "FALL", closeProbability: 50 },
    { id: "opp-21", title: "7v7 Flag Uniforms", organizationId: "org-68", organizationName: "Roseville HS", sport: "7v7 Flag", lanes: ["UNIFORM"] as RevenueLane[], stage: "LEAD_ENGAGED", value: 8045, assignedRep: "Josh Hoffman", nextAction: "Schedule follow-up", createdAt: "2026-08-07", updatedAt: "2026-08-07", lastActivity: "2026-08-07", season: "FALL", closeProbability: 50 },
    { id: "opp-22", title: "Hockey Uniforms", organizationId: "org-61", organizationName: "Bemidji HS", sport: "Hockey", lanes: ["LETTERMAN"] as RevenueLane[], stage: "INVOICE_SENT", value: 16279, assignedRep: "Josh Hoffman", nextAction: "Schedule follow-up", createdAt: "2026-08-16", updatedAt: "2026-08-16", lastActivity: "2026-08-16", season: "FALL", closeProbability: 50 },
    { id: "opp-23", title: "Football Uniforms", organizationId: "org-14", organizationName: "Maple Grove HS", sport: "Football", lanes: ["TEAM_STORE"] as RevenueLane[], stage: "LEAD_ENGAGED", value: 17867, assignedRep: "Josh Hoffman", nextAction: "Schedule follow-up", createdAt: "2026-08-03", updatedAt: "2026-08-03", lastActivity: "2026-08-03", season: "FALL", closeProbability: 50 },
    { id: "opp-24", title: "Baseball Uniforms", organizationId: "org-11", organizationName: "Prior Lake HS", sport: "Baseball", lanes: ["UNIFORM"] as RevenueLane[], stage: "DISCOVERY", value: 17170, assignedRep: "Josh Hoffman", nextAction: "Schedule follow-up", createdAt: "2026-08-04", updatedAt: "2026-08-04", lastActivity: "2026-08-04", season: "FALL", closeProbability: 50 },
    { id: "opp-25", title: "Football Uniforms", organizationId: "org-1", organizationName: "St. Cloud Tech", sport: "Football", lanes: ["UNIFORM"] as RevenueLane[], stage: "INVOICE_SENT", value: 12855, assignedRep: "Josh Hoffman", nextAction: "Schedule follow-up", createdAt: "2026-08-10", updatedAt: "2026-08-10", lastActivity: "2026-08-10", season: "FALL", closeProbability: 50 },
    { id: "opp-26", title: "7v7 Flag Uniforms", organizationId: "org-20", organizationName: "Roseville HS", sport: "7v7 Flag", lanes: ["LETTERMAN"] as RevenueLane[], stage: "INVOICE_SENT", value: 13279, assignedRep: "Josh Hoffman", nextAction: "Schedule follow-up", createdAt: "2026-08-07", updatedAt: "2026-08-07", lastActivity: "2026-08-07", season: "FALL", closeProbability: 50 },
    { id: "opp-27", title: "Wrestling Uniforms", organizationId: "org-77", organizationName: "Hopkins HS", sport: "Wrestling", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "DISCOVERY", value: 5695, assignedRep: "Josh Hoffman", nextAction: "Schedule follow-up", createdAt: "2026-07-28", updatedAt: "2026-07-28", lastActivity: "2026-07-28", season: "FALL", closeProbability: 50 },
    { id: "opp-28", title: "7v7 Flag Uniforms", organizationId: "org-76", organizationName: "Maple Grove HS", sport: "7v7 Flag", lanes: ["UNIFORM"] as RevenueLane[], stage: "INVOICE_SENT", value: 15900, assignedRep: "Josh Hoffman", nextAction: "Schedule follow-up", createdAt: "2026-08-15", updatedAt: "2026-08-15", lastActivity: "2026-08-15", season: "FALL", closeProbability: 50 },
    { id: "opp-29", title: "Volleyball Uniforms", organizationId: "org-26", organizationName: "Wayzata HS", sport: "Volleyball", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "INVOICE_SENT", value: 15516, assignedRep: "Josh Hoffman", nextAction: "Schedule follow-up", createdAt: "2026-08-10", updatedAt: "2026-08-10", lastActivity: "2026-08-10", season: "FALL", closeProbability: 50 },
    { id: "opp-30", title: "Football Uniforms", organizationId: "org-41", organizationName: "Edina HS", sport: "Football", lanes: ["UNIFORM"] as RevenueLane[], stage: "INVOICE_SENT", value: 8573, assignedRep: "Josh Hoffman", nextAction: "Schedule follow-up", createdAt: "2026-08-17", updatedAt: "2026-08-17", lastActivity: "2026-08-17", season: "FALL", closeProbability: 50 },
    { id: "opp-31", title: "Hockey Uniforms", organizationId: "org-84", organizationName: "Anoka HS", sport: "Hockey", lanes: ["TEAM_STORE"] as RevenueLane[], stage: "CLOSED_WON", value: 6762, assignedRep: "Shayla Hilliard", nextAction: "Follow up for reorder", createdAt: "2026-07-15", updatedAt: "2026-07-15", lastActivity: "2026-07-15", season: "FALL", closeProbability: 50 },
    { id: "opp-32", title: "Basketball Uniforms", organizationId: "org-56", organizationName: "Lakeville North", sport: "Basketball", lanes: ["UNIFORM"] as RevenueLane[], stage: "CLOSED_WON", value: 11075, assignedRep: "Shayla Hilliard", nextAction: "Follow up for reorder", createdAt: "2026-08-08", updatedAt: "2026-08-08", lastActivity: "2026-08-08", season: "FALL", closeProbability: 50 },
    { id: "opp-33", title: "Baseball Uniforms", organizationId: "org-40", organizationName: "Bemidji HS", sport: "Baseball", lanes: ["UNIFORM"] as RevenueLane[], stage: "CLOSED_WON", value: 7107, assignedRep: "Shayla Hilliard", nextAction: "Follow up for reorder", createdAt: "2026-07-14", updatedAt: "2026-07-14", lastActivity: "2026-07-14", season: "FALL", closeProbability: 50 },
    { id: "opp-34", title: "Basketball Uniforms", organizationId: "org-81", organizationName: "Rochester Mayo", sport: "Basketball", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "CLOSED_WON", value: 13503, assignedRep: "Shayla Hilliard", nextAction: "Follow up for reorder", createdAt: "2026-07-13", updatedAt: "2026-07-13", lastActivity: "2026-07-13", season: "FALL", closeProbability: 50 },
    { id: "opp-35", title: "7v7 Flag Uniforms", organizationId: "org-83", organizationName: "Apple Valley HS", sport: "7v7 Flag", lanes: ["TEAM_STORE"] as RevenueLane[], stage: "CLOSED_WON", value: 10527, assignedRep: "Shayla Hilliard", nextAction: "Follow up for reorder", createdAt: "2026-07-02", updatedAt: "2026-07-02", lastActivity: "2026-07-02", season: "FALL", closeProbability: 50 },
    { id: "opp-36", title: "Volleyball Uniforms", organizationId: "org-82", organizationName: "Apple Valley HS", sport: "Volleyball", lanes: ["LETTERMAN"] as RevenueLane[], stage: "CLOSED_WON", value: 9689, assignedRep: "Shayla Hilliard", nextAction: "Follow up for reorder", createdAt: "2026-07-08", updatedAt: "2026-07-08", lastActivity: "2026-07-08", season: "FALL", closeProbability: 50 },
    { id: "opp-37", title: "Volleyball Uniforms", organizationId: "org-46", organizationName: "Bemidji HS", sport: "Volleyball", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "CLOSED_WON", value: 5302, assignedRep: "Shayla Hilliard", nextAction: "Follow up for reorder", createdAt: "2026-07-27", updatedAt: "2026-07-27", lastActivity: "2026-07-27", season: "FALL", closeProbability: 50 },
    { id: "opp-38", title: "Hockey Uniforms", organizationId: "org-61", organizationName: "Eden Prairie HS", sport: "Hockey", lanes: ["UNIFORM"] as RevenueLane[], stage: "CLOSED_WON", value: 6720, assignedRep: "Shayla Hilliard", nextAction: "Follow up for reorder", createdAt: "2026-08-15", updatedAt: "2026-08-15", lastActivity: "2026-08-15", season: "FALL", closeProbability: 50 },
    { id: "opp-39", title: "Baseball Uniforms", organizationId: "org-7", organizationName: "Anoka HS", sport: "Baseball", lanes: ["UNIFORM"] as RevenueLane[], stage: "LEAD_ENGAGED", value: 16805, assignedRep: "Shayla Hilliard", nextAction: "Schedule follow-up", createdAt: "2026-08-20", updatedAt: "2026-08-20", lastActivity: "2026-08-20", season: "FALL", closeProbability: 50 },
    { id: "opp-40", title: "Baseball Uniforms", organizationId: "org-22", organizationName: "Roseville HS", sport: "Baseball", lanes: ["UNIFORM"] as RevenueLane[], stage: "LEAD_ENGAGED", value: 6972, assignedRep: "Shayla Hilliard", nextAction: "Schedule follow-up", createdAt: "2026-08-10", updatedAt: "2026-08-10", lastActivity: "2026-08-10", season: "FALL", closeProbability: 50 },
    { id: "opp-41", title: "Hockey Uniforms", organizationId: "org-61", organizationName: "White Bear Lake HS", sport: "Hockey", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "MOCKUP_STAGE", value: 11903, assignedRep: "Shayla Hilliard", nextAction: "Schedule follow-up", createdAt: "2026-08-19", updatedAt: "2026-08-19", lastActivity: "2026-08-19", season: "FALL", closeProbability: 50 },
    { id: "opp-42", title: "Football Uniforms", organizationId: "org-22", organizationName: "Prior Lake HS", sport: "Football", lanes: ["UNIFORM"] as RevenueLane[], stage: "MOCKUP_STAGE", value: 16101, assignedRep: "Shayla Hilliard", nextAction: "Schedule follow-up", createdAt: "2026-08-14", updatedAt: "2026-08-14", lastActivity: "2026-08-14", season: "FALL", closeProbability: 50 },
    { id: "opp-43", title: "Baseball Uniforms", organizationId: "org-31", organizationName: "Maple Grove HS", sport: "Baseball", lanes: ["UNIFORM"] as RevenueLane[], stage: "DISCOVERY", value: 8301, assignedRep: "Shayla Hilliard", nextAction: "Schedule follow-up", createdAt: "2026-08-03", updatedAt: "2026-08-03", lastActivity: "2026-08-03", season: "FALL", closeProbability: 50 },
    { id: "opp-44", title: "Hockey Uniforms", organizationId: "org-30", organizationName: "Hopkins HS", sport: "Hockey", lanes: ["LETTERMAN"] as RevenueLane[], stage: "LEAD_ENGAGED", value: 16528, assignedRep: "Shayla Hilliard", nextAction: "Schedule follow-up", createdAt: "2026-07-30", updatedAt: "2026-07-30", lastActivity: "2026-07-30", season: "FALL", closeProbability: 50 },
    { id: "opp-45", title: "Wrestling Uniforms", organizationId: "org-9", organizationName: "Lakeville North", sport: "Wrestling", lanes: ["TEAM_STORE"] as RevenueLane[], stage: "INVOICE_SENT", value: 17670, assignedRep: "Shayla Hilliard", nextAction: "Schedule follow-up", createdAt: "2026-08-21", updatedAt: "2026-08-21", lastActivity: "2026-08-21", season: "FALL", closeProbability: 50 },
    { id: "opp-46", title: "Wrestling Uniforms", organizationId: "org-89", organizationName: "Lakeville North", sport: "Wrestling", lanes: ["LETTERMAN"] as RevenueLane[], stage: "DISCOVERY", value: 5833, assignedRep: "Shayla Hilliard", nextAction: "Schedule follow-up", createdAt: "2026-08-02", updatedAt: "2026-08-02", lastActivity: "2026-08-02", season: "FALL", closeProbability: 50 },
    { id: "opp-47", title: "7v7 Flag Uniforms", organizationId: "org-91", organizationName: "Anoka HS", sport: "7v7 Flag", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "LEAD_ENGAGED", value: 13356, assignedRep: "Shayla Hilliard", nextAction: "Schedule follow-up", createdAt: "2026-08-10", updatedAt: "2026-08-10", lastActivity: "2026-08-10", season: "FALL", closeProbability: 50 },
    { id: "opp-48", title: "Hockey Uniforms", organizationId: "org-87", organizationName: "Prior Lake HS", sport: "Hockey", lanes: ["UNIFORM"] as RevenueLane[], stage: "INVOICE_SENT", value: 10390, assignedRep: "Shayla Hilliard", nextAction: "Schedule follow-up", createdAt: "2026-08-17", updatedAt: "2026-08-17", lastActivity: "2026-08-17", season: "FALL", closeProbability: 50 },
    { id: "opp-49", title: "Wrestling Uniforms", organizationId: "org-26", organizationName: "Rochester Mayo", sport: "Wrestling", lanes: ["UNIFORM"] as RevenueLane[], stage: "DISCOVERY", value: 8370, assignedRep: "Shayla Hilliard", nextAction: "Schedule follow-up", createdAt: "2026-07-27", updatedAt: "2026-07-27", lastActivity: "2026-07-27", season: "FALL", closeProbability: 50 },
    { id: "opp-50", title: "Football Uniforms", organizationId: "org-90", organizationName: "St. Cloud Tech", sport: "Football", lanes: ["LETTERMAN"] as RevenueLane[], stage: "DISCOVERY", value: 12022, assignedRep: "Shayla Hilliard", nextAction: "Schedule follow-up", createdAt: "2026-08-09", updatedAt: "2026-08-09", lastActivity: "2026-08-09", season: "FALL", closeProbability: 50 },
    { id: "opp-51", title: "7v7 Flag Uniforms", organizationId: "org-10", organizationName: "Roseville HS", sport: "7v7 Flag", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "CLOSED_WON", value: 16244, assignedRep: "Jason Mulder", nextAction: "Follow up for reorder", createdAt: "2026-07-06", updatedAt: "2026-07-06", lastActivity: "2026-07-06", season: "FALL", closeProbability: 50 },
    { id: "opp-52", title: "Basketball Uniforms", organizationId: "org-73", organizationName: "Rochester Mayo", sport: "Basketball", lanes: ["TEAM_STORE"] as RevenueLane[], stage: "CLOSED_WON", value: 12470, assignedRep: "Jason Mulder", nextAction: "Follow up for reorder", createdAt: "2026-07-20", updatedAt: "2026-07-20", lastActivity: "2026-07-20", season: "FALL", closeProbability: 50 },
    { id: "opp-53", title: "Volleyball Uniforms", organizationId: "org-42", organizationName: "Prior Lake HS", sport: "Volleyball", lanes: ["UNIFORM"] as RevenueLane[], stage: "CLOSED_WON", value: 14703, assignedRep: "Jason Mulder", nextAction: "Follow up for reorder", createdAt: "2026-07-17", updatedAt: "2026-07-17", lastActivity: "2026-07-17", season: "FALL", closeProbability: 50 },
    { id: "opp-54", title: "Football Uniforms", organizationId: "org-61", organizationName: "Bemidji HS", sport: "Football", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "CLOSED_WON", value: 12425, assignedRep: "Jason Mulder", nextAction: "Follow up for reorder", createdAt: "2026-07-29", updatedAt: "2026-07-29", lastActivity: "2026-07-29", season: "FALL", closeProbability: 50 },
    { id: "opp-55", title: "Baseball Uniforms", organizationId: "org-11", organizationName: "Chanhassen HS", sport: "Baseball", lanes: ["LETTERMAN"] as RevenueLane[], stage: "CLOSED_WON", value: 6124, assignedRep: "Jason Mulder", nextAction: "Follow up for reorder", createdAt: "2026-08-15", updatedAt: "2026-08-15", lastActivity: "2026-08-15", season: "FALL", closeProbability: 50 },
    { id: "opp-56", title: "Football Uniforms", organizationId: "org-38", organizationName: "Minnetonka HS", sport: "Football", lanes: ["LETTERMAN"] as RevenueLane[], stage: "CLOSED_WON", value: 10522, assignedRep: "Jason Mulder", nextAction: "Follow up for reorder", createdAt: "2026-08-08", updatedAt: "2026-08-08", lastActivity: "2026-08-08", season: "FALL", closeProbability: 50 },
    { id: "opp-57", title: "Volleyball Uniforms", organizationId: "org-75", organizationName: "Shakopee HS", sport: "Volleyball", lanes: ["TEAM_STORE"] as RevenueLane[], stage: "CLOSED_WON", value: 10236, assignedRep: "Jason Mulder", nextAction: "Follow up for reorder", createdAt: "2026-07-27", updatedAt: "2026-07-27", lastActivity: "2026-07-27", season: "FALL", closeProbability: 50 },
    { id: "opp-58", title: "Baseball Uniforms", organizationId: "org-11", organizationName: "Roseville HS", sport: "Baseball", lanes: ["UNIFORM"] as RevenueLane[], stage: "CLOSED_WON", value: 8164, assignedRep: "Jason Mulder", nextAction: "Follow up for reorder", createdAt: "2026-07-26", updatedAt: "2026-07-26", lastActivity: "2026-07-26", season: "FALL", closeProbability: 50 },
    { id: "opp-59", title: "Hockey Uniforms", organizationId: "org-66", organizationName: "Anoka HS", sport: "Hockey", lanes: ["LETTERMAN"] as RevenueLane[], stage: "CLOSED_WON", value: 8594, assignedRep: "Jason Mulder", nextAction: "Follow up for reorder", createdAt: "2026-07-27", updatedAt: "2026-07-27", lastActivity: "2026-07-27", season: "FALL", closeProbability: 50 },
    { id: "opp-60", title: "Hockey Uniforms", organizationId: "org-75", organizationName: "Anoka HS", sport: "Hockey", lanes: ["LETTERMAN"] as RevenueLane[], stage: "CLOSED_WON", value: 16986, assignedRep: "Jason Mulder", nextAction: "Follow up for reorder", createdAt: "2026-08-21", updatedAt: "2026-08-21", lastActivity: "2026-08-21", season: "FALL", closeProbability: 50 },
    { id: "opp-61", title: "Basketball Uniforms", organizationId: "org-55", organizationName: "Wayzata HS", sport: "Basketball", lanes: ["TEAM_STORE"] as RevenueLane[], stage: "DISCOVERY", value: 9055, assignedRep: "Jason Mulder", nextAction: "Schedule follow-up", createdAt: "2026-08-19", updatedAt: "2026-08-19", lastActivity: "2026-08-19", season: "FALL", closeProbability: 50 },
    { id: "opp-62", title: "Baseball Uniforms", organizationId: "org-18", organizationName: "Prior Lake HS", sport: "Baseball", lanes: ["UNIFORM"] as RevenueLane[], stage: "LEAD_ENGAGED", value: 10210, assignedRep: "Jason Mulder", nextAction: "Schedule follow-up", createdAt: "2026-07-28", updatedAt: "2026-07-28", lastActivity: "2026-07-28", season: "FALL", closeProbability: 50 },
    { id: "opp-63", title: "7v7 Flag Uniforms", organizationId: "org-67", organizationName: "Rochester Mayo", sport: "7v7 Flag", lanes: ["TEAM_STORE"] as RevenueLane[], stage: "LEAD_ENGAGED", value: 9727, assignedRep: "Jason Mulder", nextAction: "Schedule follow-up", createdAt: "2026-08-14", updatedAt: "2026-08-14", lastActivity: "2026-08-14", season: "FALL", closeProbability: 50 },
    { id: "opp-64", title: "Wrestling Uniforms", organizationId: "org-2", organizationName: "Chanhassen HS", sport: "Wrestling", lanes: ["TEAM_STORE"] as RevenueLane[], stage: "DISCOVERY", value: 6049, assignedRep: "Jason Mulder", nextAction: "Schedule follow-up", createdAt: "2026-08-04", updatedAt: "2026-08-04", lastActivity: "2026-08-04", season: "FALL", closeProbability: 50 },
    { id: "opp-65", title: "Volleyball Uniforms", organizationId: "org-69", organizationName: "Stillwater HS", sport: "Volleyball", lanes: ["TEAM_STORE"] as RevenueLane[], stage: "DISCOVERY", value: 6733, assignedRep: "Jason Mulder", nextAction: "Schedule follow-up", createdAt: "2026-08-14", updatedAt: "2026-08-14", lastActivity: "2026-08-14", season: "FALL", closeProbability: 50 },
    { id: "opp-66", title: "Football Uniforms", organizationId: "org-13", organizationName: "Apple Valley HS", sport: "Football", lanes: ["TEAM_STORE"] as RevenueLane[], stage: "DISCOVERY", value: 6651, assignedRep: "Jason Mulder", nextAction: "Schedule follow-up", createdAt: "2026-08-24", updatedAt: "2026-08-24", lastActivity: "2026-08-24", season: "FALL", closeProbability: 50 },
    { id: "opp-67", title: "Football Uniforms", organizationId: "org-74", organizationName: "Edina HS", sport: "Football", lanes: ["TEAM_STORE"] as RevenueLane[], stage: "LEAD_ENGAGED", value: 10311, assignedRep: "Jason Mulder", nextAction: "Schedule follow-up", createdAt: "2026-08-10", updatedAt: "2026-08-10", lastActivity: "2026-08-10", season: "FALL", closeProbability: 50 },
    { id: "opp-68", title: "7v7 Flag Uniforms", organizationId: "org-25", organizationName: "Cretin-Derham Hall", sport: "7v7 Flag", lanes: ["UNIFORM"] as RevenueLane[], stage: "INVOICE_SENT", value: 17129, assignedRep: "Jason Mulder", nextAction: "Schedule follow-up", createdAt: "2026-08-04", updatedAt: "2026-08-04", lastActivity: "2026-08-04", season: "FALL", closeProbability: 50 },
    { id: "opp-69", title: "7v7 Flag Uniforms", organizationId: "org-77", organizationName: "Wayzata HS", sport: "7v7 Flag", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "INVOICE_SENT", value: 8334, assignedRep: "Jason Mulder", nextAction: "Schedule follow-up", createdAt: "2026-08-15", updatedAt: "2026-08-15", lastActivity: "2026-08-15", season: "FALL", closeProbability: 50 },
    { id: "opp-70", title: "Football Uniforms", organizationId: "org-6", organizationName: "Cretin-Derham Hall", sport: "Football", lanes: ["UNIFORM"] as RevenueLane[], stage: "INVOICE_SENT", value: 9013, assignedRep: "Jason Mulder", nextAction: "Schedule follow-up", createdAt: "2026-08-02", updatedAt: "2026-08-02", lastActivity: "2026-08-02", season: "FALL", closeProbability: 50 },
    { id: "opp-71", title: "Hockey Uniforms", organizationId: "org-28", organizationName: "White Bear Lake HS", sport: "Hockey", lanes: ["TEAM_STORE"] as RevenueLane[], stage: "INVOICE_SENT", value: 10310, assignedRep: "Jason Mulder", nextAction: "Schedule follow-up", createdAt: "2026-08-21", updatedAt: "2026-08-21", lastActivity: "2026-08-21", season: "FALL", closeProbability: 50 },
    { id: "opp-72", title: "Football Uniforms", organizationId: "org-68", organizationName: "Hopkins HS", sport: "Football", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "INVOICE_SENT", value: 8336, assignedRep: "Jason Mulder", nextAction: "Schedule follow-up", createdAt: "2026-07-31", updatedAt: "2026-07-31", lastActivity: "2026-07-31", season: "FALL", closeProbability: 50 },
    { id: "opp-73", title: "Basketball Uniforms", organizationId: "org-15", organizationName: "Prior Lake HS", sport: "Basketball", lanes: ["UNIFORM"] as RevenueLane[], stage: "MOCKUP_STAGE", value: 7389, assignedRep: "Jason Mulder", nextAction: "Schedule follow-up", createdAt: "2026-08-10", updatedAt: "2026-08-10", lastActivity: "2026-08-10", season: "FALL", closeProbability: 50 },
    { id: "opp-74", title: "Volleyball Uniforms", organizationId: "org-55", organizationName: "Roseville HS", sport: "Volleyball", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "DISCOVERY", value: 10342, assignedRep: "Jason Mulder", nextAction: "Schedule follow-up", createdAt: "2026-08-03", updatedAt: "2026-08-03", lastActivity: "2026-08-03", season: "FALL", closeProbability: 50 },
    { id: "opp-75", title: "7v7 Flag Uniforms", organizationId: "org-20", organizationName: "Cretin-Derham Hall", sport: "7v7 Flag", lanes: ["UNIFORM"] as RevenueLane[], stage: "INVOICE_SENT", value: 12578, assignedRep: "Jason Mulder", nextAction: "Schedule follow-up", createdAt: "2026-07-28", updatedAt: "2026-07-28", lastActivity: "2026-07-28", season: "FALL", closeProbability: 50 },
    { id: "opp-76", title: "Football Uniforms", organizationId: "org-84", organizationName: "Anoka HS", sport: "Football", lanes: ["LETTERMAN"] as RevenueLane[], stage: "CLOSED_WON", value: 11319, assignedRep: "David Lundberg", nextAction: "Follow up for reorder", createdAt: "2026-07-19", updatedAt: "2026-07-19", lastActivity: "2026-07-19", season: "FALL", closeProbability: 50 },
    { id: "opp-77", title: "Volleyball Uniforms", organizationId: "org-80", organizationName: "St. Cloud Tech", sport: "Volleyball", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "CLOSED_WON", value: 10052, assignedRep: "David Lundberg", nextAction: "Follow up for reorder", createdAt: "2026-07-28", updatedAt: "2026-07-28", lastActivity: "2026-07-28", season: "FALL", closeProbability: 50 },
    { id: "opp-78", title: "Wrestling Uniforms", organizationId: "org-76", organizationName: "Apple Valley HS", sport: "Wrestling", lanes: ["UNIFORM"] as RevenueLane[], stage: "CLOSED_WON", value: 13303, assignedRep: "David Lundberg", nextAction: "Follow up for reorder", createdAt: "2026-08-08", updatedAt: "2026-08-08", lastActivity: "2026-08-08", season: "FALL", closeProbability: 50 },
    { id: "opp-79", title: "7v7 Flag Uniforms", organizationId: "org-33", organizationName: "Shakopee HS", sport: "7v7 Flag", lanes: ["UNIFORM"] as RevenueLane[], stage: "CLOSED_WON", value: 7272, assignedRep: "David Lundberg", nextAction: "Follow up for reorder", createdAt: "2026-08-06", updatedAt: "2026-08-06", lastActivity: "2026-08-06", season: "FALL", closeProbability: 50 },
    { id: "opp-80", title: "Football Uniforms", organizationId: "org-39", organizationName: "Hopkins HS", sport: "Football", lanes: ["UNIFORM"] as RevenueLane[], stage: "CLOSED_WON", value: 11354, assignedRep: "David Lundberg", nextAction: "Follow up for reorder", createdAt: "2026-07-23", updatedAt: "2026-07-23", lastActivity: "2026-07-23", season: "FALL", closeProbability: 50 },
    { id: "opp-81", title: "Hockey Uniforms", organizationId: "org-52", organizationName: "Rochester Mayo", sport: "Hockey", lanes: ["LETTERMAN"] as RevenueLane[], stage: "DISCOVERY", value: 16002, assignedRep: "David Lundberg", nextAction: "Schedule follow-up", createdAt: "2026-07-29", updatedAt: "2026-07-29", lastActivity: "2026-07-29", season: "FALL", closeProbability: 50 },
    { id: "opp-82", title: "7v7 Flag Uniforms", organizationId: "org-49", organizationName: "Hopkins HS", sport: "7v7 Flag", lanes: ["UNIFORM"] as RevenueLane[], stage: "INVOICE_SENT", value: 10111, assignedRep: "David Lundberg", nextAction: "Schedule follow-up", createdAt: "2026-07-31", updatedAt: "2026-07-31", lastActivity: "2026-07-31", season: "FALL", closeProbability: 50 },
    { id: "opp-83", title: "Hockey Uniforms", organizationId: "org-30", organizationName: "St. Cloud Tech", sport: "Hockey", lanes: ["UNIFORM"] as RevenueLane[], stage: "LEAD_ENGAGED", value: 9698, assignedRep: "David Lundberg", nextAction: "Schedule follow-up", createdAt: "2026-07-27", updatedAt: "2026-07-27", lastActivity: "2026-07-27", season: "FALL", closeProbability: 50 },
    { id: "opp-84", title: "Basketball Uniforms", organizationId: "org-33", organizationName: "Hopkins HS", sport: "Basketball", lanes: ["LETTERMAN"] as RevenueLane[], stage: "MOCKUP_STAGE", value: 13092, assignedRep: "David Lundberg", nextAction: "Schedule follow-up", createdAt: "2026-08-13", updatedAt: "2026-08-13", lastActivity: "2026-08-13", season: "FALL", closeProbability: 50 },
    { id: "opp-85", title: "7v7 Flag Uniforms", organizationId: "org-52", organizationName: "Wayzata HS", sport: "7v7 Flag", lanes: ["LETTERMAN"] as RevenueLane[], stage: "MOCKUP_STAGE", value: 16166, assignedRep: "David Lundberg", nextAction: "Schedule follow-up", createdAt: "2026-08-16", updatedAt: "2026-08-16", lastActivity: "2026-08-16", season: "FALL", closeProbability: 50 },
    { id: "opp-86", title: "Volleyball Uniforms", organizationId: "org-18", organizationName: "Cretin-Derham Hall", sport: "Volleyball", lanes: ["LETTERMAN"] as RevenueLane[], stage: "LEAD_ENGAGED", value: 11742, assignedRep: "David Lundberg", nextAction: "Schedule follow-up", createdAt: "2026-08-13", updatedAt: "2026-08-13", lastActivity: "2026-08-13", season: "FALL", closeProbability: 50 },
    { id: "opp-87", title: "Hockey Uniforms", organizationId: "org-83", organizationName: "Eden Prairie HS", sport: "Hockey", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "INVOICE_SENT", value: 6885, assignedRep: "David Lundberg", nextAction: "Schedule follow-up", createdAt: "2026-08-18", updatedAt: "2026-08-18", lastActivity: "2026-08-18", season: "FALL", closeProbability: 50 },
    { id: "opp-88", title: "Basketball Uniforms", organizationId: "org-51", organizationName: "Roseville HS", sport: "Basketball", lanes: ["LETTERMAN"] as RevenueLane[], stage: "INVOICE_SENT", value: 7196, assignedRep: "David Lundberg", nextAction: "Schedule follow-up", createdAt: "2026-08-11", updatedAt: "2026-08-11", lastActivity: "2026-08-11", season: "FALL", closeProbability: 50 },
    { id: "opp-89", title: "Hockey Uniforms", organizationId: "org-47", organizationName: "White Bear Lake HS", sport: "Hockey", lanes: ["LETTERMAN"] as RevenueLane[], stage: "CLOSED_WON", value: 5299, assignedRep: "Primeau Hill", nextAction: "Follow up for reorder", createdAt: "2026-08-11", updatedAt: "2026-08-11", lastActivity: "2026-08-11", season: "FALL", closeProbability: 50 },
    { id: "opp-90", title: "Baseball Uniforms", organizationId: "org-48", organizationName: "Moorhead HS", sport: "Baseball", lanes: ["UNIFORM"] as RevenueLane[], stage: "CLOSED_WON", value: 12744, assignedRep: "Primeau Hill", nextAction: "Follow up for reorder", createdAt: "2026-07-27", updatedAt: "2026-07-27", lastActivity: "2026-07-27", season: "FALL", closeProbability: 50 },
    { id: "opp-91", title: "7v7 Flag Uniforms", organizationId: "org-46", organizationName: "Maple Grove HS", sport: "7v7 Flag", lanes: ["TEAM_STORE"] as RevenueLane[], stage: "CLOSED_WON", value: 17069, assignedRep: "Primeau Hill", nextAction: "Follow up for reorder", createdAt: "2026-07-10", updatedAt: "2026-07-10", lastActivity: "2026-07-10", season: "FALL", closeProbability: 50 },
    { id: "opp-92", title: "Basketball Uniforms", organizationId: "org-38", organizationName: "Shakopee HS", sport: "Basketball", lanes: ["TEAM_STORE"] as RevenueLane[], stage: "CLOSED_WON", value: 9248, assignedRep: "Primeau Hill", nextAction: "Follow up for reorder", createdAt: "2026-07-07", updatedAt: "2026-07-07", lastActivity: "2026-07-07", season: "FALL", closeProbability: 50 },
    { id: "opp-93", title: "Baseball Uniforms", organizationId: "org-51", organizationName: "Prior Lake HS", sport: "Baseball", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "INVOICE_SENT", value: 15846, assignedRep: "Primeau Hill", nextAction: "Schedule follow-up", createdAt: "2026-08-20", updatedAt: "2026-08-20", lastActivity: "2026-08-20", season: "FALL", closeProbability: 50 },
    { id: "opp-94", title: "Hockey Uniforms", organizationId: "org-92", organizationName: "Stillwater HS", sport: "Hockey", lanes: ["TRAVEL_GEAR"] as RevenueLane[], stage: "INVOICE_SENT", value: 5046, assignedRep: "Primeau Hill", nextAction: "Schedule follow-up", createdAt: "2026-08-13", updatedAt: "2026-08-13", lastActivity: "2026-08-13", season: "FALL", closeProbability: 50 },
    { id: "opp-95", title: "Football Uniforms", organizationId: "org-20", organizationName: "Moorhead HS", sport: "Football", lanes: ["LETTERMAN"] as RevenueLane[], stage: "DISCOVERY", value: 11210, assignedRep: "Primeau Hill", nextAction: "Schedule follow-up", createdAt: "2026-08-19", updatedAt: "2026-08-19", lastActivity: "2026-08-19", season: "FALL", closeProbability: 50 },
    { id: "opp-96", title: "Volleyball Uniforms", organizationId: "org-8", organizationName: "Edina HS", sport: "Volleyball", lanes: ["TEAM_STORE"] as RevenueLane[], stage: "LEAD_ENGAGED", value: 10754, assignedRep: "Primeau Hill", nextAction: "Schedule follow-up", createdAt: "2026-08-07", updatedAt: "2026-08-07", lastActivity: "2026-08-07", season: "FALL", closeProbability: 50 },
    { id: "opp-97", title: "Baseball Uniforms", organizationId: "org-41", organizationName: "White Bear Lake HS", sport: "Baseball", lanes: ["LETTERMAN"] as RevenueLane[], stage: "DISCOVERY", value: 5206, assignedRep: "Primeau Hill", nextAction: "Schedule follow-up", createdAt: "2026-08-18", updatedAt: "2026-08-18", lastActivity: "2026-08-18", season: "FALL", closeProbability: 50 },
    { id: "opp-98", title: "Hockey Uniforms", organizationId: "org-94", organizationName: "Maple Grove HS", sport: "Hockey", lanes: ["UNIFORM"] as RevenueLane[], stage: "DISCOVERY", value: 16132, assignedRep: "Primeau Hill", nextAction: "Schedule follow-up", createdAt: "2026-07-31", updatedAt: "2026-07-31", lastActivity: "2026-07-31", season: "FALL", closeProbability: 50 },
    { id: "opp-99", title: "Baseball Uniforms", organizationId: "org-43", organizationName: "Anoka HS", sport: "Baseball", lanes: ["UNIFORM"] as RevenueLane[], stage: "CLOSED_LOST", value: 12550, assignedRep: "Jason Mulder", nextAction: "Review loss reason", createdAt: "2026-07-26", updatedAt: "2026-07-26", lastActivity: "2026-07-26", season: "FALL", closeProbability: 50 },
    { id: "opp-100", title: "Baseball Uniforms", organizationId: "org-15", organizationName: "Anoka HS", sport: "Baseball", lanes: ["UNIFORM"] as RevenueLane[], stage: "CLOSED_LOST", value: 5753, assignedRep: "Jason Mulder", nextAction: "Review loss reason", createdAt: "2026-08-12", updatedAt: "2026-08-12", lastActivity: "2026-08-12", season: "FALL", closeProbability: 50 },
    { id: "opp-101", title: "Wrestling Uniforms", organizationId: "org-4", organizationName: "St. Cloud Tech", sport: "Wrestling", lanes: ["UNIFORM"] as RevenueLane[], stage: "CLOSED_LOST", value: 11650, assignedRep: "Primeau Hill", nextAction: "Review loss reason", createdAt: "2026-07-19", updatedAt: "2026-07-19", lastActivity: "2026-07-19", season: "FALL", closeProbability: 50 },
    { id: "opp-102", title: "7v7 Flag Uniforms", organizationId: "org-49", organizationName: "Bemidji HS", sport: "7v7 Flag", lanes: ["UNIFORM"] as RevenueLane[], stage: "CLOSED_LOST", value: 7751, assignedRep: "Josh Hoffman", nextAction: "Review loss reason", createdAt: "2026-07-27", updatedAt: "2026-07-27", lastActivity: "2026-07-27", season: "FALL", closeProbability: 50 },

];
export const orders: Order[] = [
  { id: "ord-1", organizationId: "org-86", organizationName: "Eden Prairie HS", opportunityId: "opp-1", title: "Baseball Uniforms", sport: "Baseball", lane: "TRAVEL_GEAR" as RevenueLane, value: 7992, quantity: 999, productionStatus: "IN_PRODUCTION", orderStage: "COMPLETED", createdDate: "2026-07-19", createdAt: "2026-07-19", updatedAt: "2026-07-19", dueDate: "2026-12-28", assignedRep: "Josh Hoffman", assignedDirector: "Primeau Hill Director", nextAction: "Review production status", riskStatus: "green", vendor: "BSN Sports", vendorNotes: "BSN Sports order #TUF-2026000. Standard baseball order.", missingInfo: [] },
  { id: "ord-2", organizationId: "org-27", organizationName: "Chanhassen HS", opportunityId: "opp-2", title: "Wrestling Uniforms", sport: "Wrestling", lane: "LETTERMAN" as RevenueLane, value: 10136, quantity: 1013, productionStatus: "BLOCKED", orderStage: "COMPLETED", createdDate: "2026-07-31", createdAt: "2026-07-31", updatedAt: "2026-07-31", dueDate: "2026-12-28", assignedRep: "Josh Hoffman", assignedDirector: "Primeau Hill Director", nextAction: "Resolve blocker", riskStatus: "green", vendor: "Under Armour", vendorNotes: "Under Armour order #TUF-2026001. Standard wrestling order.", missingInfo: [] },
  { id: "ord-3", organizationId: "org-24", organizationName: "Apple Valley HS", opportunityId: "opp-3", title: "7v7 Flag Uniforms", sport: "7v7 Flag", lane: "TRAVEL_GEAR" as RevenueLane, value: 6670, quantity: 555, productionStatus: "COMPLETED", orderStage: "COMPLETED", createdDate: "2026-08-17", createdAt: "2026-08-17", updatedAt: "2026-08-17", dueDate: "2026-12-28", assignedRep: "Josh Hoffman", assignedDirector: "Primeau Hill Director", nextAction: "Archive order", riskStatus: "green", vendor: "Nike Team", vendorNotes: "Nike Team order #TUF-2026002. Standard 7v7 flag order.", missingInfo: [] },
  { id: "ord-4", organizationId: "org-94", organizationName: "Shakopee HS", opportunityId: "opp-4", title: "7v7 Flag Uniforms", sport: "7v7 Flag", lane: "LETTERMAN" as RevenueLane, value: 8515, quantity: 608, productionStatus: "IN_PRODUCTION", orderStage: "COMPLETED", createdDate: "2026-07-25", createdAt: "2026-07-25", updatedAt: "2026-07-25", dueDate: "2026-12-28", assignedRep: "Josh Hoffman", assignedDirector: "Primeau Hill Director", nextAction: "Review production status", riskStatus: "green", vendor: "Adidas", vendorNotes: "Adidas order #TUF-2026003. Standard 7v7 flag order.", missingInfo: [] },
  { id: "ord-5", organizationId: "org-29", organizationName: "Anoka HS", opportunityId: "opp-5", title: "Hockey Uniforms", sport: "Hockey", lane: "TRAVEL_GEAR" as RevenueLane, value: 9323, quantity: 582, productionStatus: "BLOCKED", orderStage: "COMPLETED", createdDate: "2026-07-05", createdAt: "2026-07-05", updatedAt: "2026-07-05", dueDate: "2026-11-19", assignedRep: "Josh Hoffman", assignedDirector: "Primeau Hill Director", nextAction: "Resolve blocker", riskStatus: "green", vendor: "Champion", vendorNotes: "Champion order #TUF-2026004. Standard hockey order.", missingInfo: [] },
  { id: "ord-6", organizationId: "org-17", organizationName: "Minnetonka HS", opportunityId: "opp-6", title: "7v7 Flag Uniforms", sport: "7v7 Flag", lane: "TEAM_STORE" as RevenueLane, value: 5462, quantity: 682, productionStatus: "COMPLETED", orderStage: "COMPLETED", createdDate: "2026-08-09", createdAt: "2026-08-09", updatedAt: "2026-08-09", dueDate: "2026-12-23", assignedRep: "Josh Hoffman", assignedDirector: "Primeau Hill Director", nextAction: "Archive order", riskStatus: "green", vendor: "Badger Sport", vendorNotes: "Badger Sport order #TUF-2026005. Standard 7v7 flag order.", missingInfo: [] },
  { id: "ord-7", organizationId: "org-60", organizationName: "Maple Grove HS", opportunityId: "opp-7", title: "Volleyball Uniforms", sport: "Volleyball", lane: "UNIFORM" as RevenueLane, value: 12098, quantity: 1209, productionStatus: "IN_PRODUCTION", orderStage: "COMPLETED", createdDate: "2026-07-28", createdAt: "2026-07-28", updatedAt: "2026-07-28", dueDate: "2026-12-28", assignedRep: "Josh Hoffman", assignedDirector: "Primeau Hill Director", nextAction: "Review production status", riskStatus: "green", vendor: "A4", vendorNotes: "A4 order #TUF-2026006. Standard volleyball order.", missingInfo: [] },
  { id: "ord-8", organizationId: "org-77", organizationName: "Shakopee HS", opportunityId: "opp-8", title: "7v7 Flag Uniforms", sport: "7v7 Flag", lane: "LETTERMAN" as RevenueLane, value: 15581, quantity: 1298, productionStatus: "BLOCKED", orderStage: "COMPLETED", createdDate: "2026-08-10", createdAt: "2026-08-10", updatedAt: "2026-08-10", dueDate: "2026-12-24", assignedRep: "Josh Hoffman", assignedDirector: "Primeau Hill Director", nextAction: "Resolve blocker", riskStatus: "green", vendor: "Eastbay", vendorNotes: "Eastbay order #TUF-2026007. Standard 7v7 flag order.", missingInfo: [] },
  { id: "ord-9", organizationId: "org-33", organizationName: "Bemidji HS", opportunityId: "opp-9", title: "Baseball Uniforms", sport: "Baseball", lane: "TEAM_STORE" as RevenueLane, value: 6838, quantity: 488, productionStatus: "COMPLETED", orderStage: "COMPLETED", createdDate: "2026-07-10", createdAt: "2026-07-10", updatedAt: "2026-07-10", dueDate: "2026-12-24", assignedRep: "Josh Hoffman", assignedDirector: "Primeau Hill Director", nextAction: "Archive order", riskStatus: "green", vendor: "BSN Sports", vendorNotes: "BSN Sports order #TUF-2026008. Standard baseball order.", missingInfo: [] },
  { id: "ord-10", organizationId: "org-47", organizationName: "Chanhassen HS", opportunityId: "opp-10", title: "7v7 Flag Uniforms", sport: "7v7 Flag", lane: "TRAVEL_GEAR" as RevenueLane, value: 6433, quantity: 402, productionStatus: "IN_PRODUCTION", orderStage: "COMPLETED", createdDate: "2026-07-12", createdAt: "2026-07-12", updatedAt: "2026-07-12", dueDate: "2026-12-26", assignedRep: "Josh Hoffman", assignedDirector: "Primeau Hill Director", nextAction: "Review production status", riskStatus: "green", vendor: "Under Armour", vendorNotes: "Under Armour order #TUF-2026009. Standard 7v7 flag order.", missingInfo: [] },
  { id: "ord-11", organizationId: "org-40", organizationName: "Wayzata HS", opportunityId: "opp-11", title: "7v7 Flag Uniforms", sport: "7v7 Flag", lane: "LETTERMAN" as RevenueLane, value: 6774, quantity: 846, productionStatus: "BLOCKED", orderStage: "COMPLETED", createdDate: "2026-07-02", createdAt: "2026-07-02", updatedAt: "2026-07-02", dueDate: "2026-10-16", assignedRep: "Josh Hoffman", assignedDirector: "Primeau Hill Director", nextAction: "Resolve blocker", riskStatus: "green", vendor: "Nike Team", vendorNotes: "Nike Team order #TUF-2026010. Standard 7v7 flag order.", missingInfo: [] },
  { id: "ord-12", organizationId: "org-81", organizationName: "Roseville HS", opportunityId: "opp-12", title: "Basketball Uniforms", sport: "Basketball", lane: "LETTERMAN" as RevenueLane, value: 12334, quantity: 1233, productionStatus: "COMPLETED", orderStage: "COMPLETED", createdDate: "2026-08-18", createdAt: "2026-08-18", updatedAt: "2026-08-18", dueDate: "2026-12-28", assignedRep: "Josh Hoffman", assignedDirector: "Primeau Hill Director", nextAction: "Archive order", riskStatus: "green", vendor: "Adidas", vendorNotes: "Adidas order #TUF-2026011. Standard basketball order.", missingInfo: [] },
  { id: "ord-13", organizationId: "org-84", organizationName: "Anoka HS", opportunityId: "opp-31", title: "Hockey Uniforms", sport: "Hockey", lane: "TEAM_STORE" as RevenueLane, value: 6762, quantity: 563, productionStatus: "IN_PRODUCTION", orderStage: "COMPLETED", createdDate: "2026-07-15", createdAt: "2026-07-15", updatedAt: "2026-07-15", dueDate: "2026-12-28", assignedRep: "Shayla Hilliard", assignedDirector: "Primeau Hill Director", nextAction: "Review production status", riskStatus: "green", vendor: "Champion", vendorNotes: "Champion order #TUF-2026012. Standard hockey order.", missingInfo: [] },
  { id: "ord-14", organizationId: "org-56", organizationName: "Lakeville North", opportunityId: "opp-32", title: "Basketball Uniforms", sport: "Basketball", lane: "UNIFORM" as RevenueLane, value: 11075, quantity: 791, productionStatus: "BLOCKED", orderStage: "COMPLETED", createdDate: "2026-08-08", createdAt: "2026-08-08", updatedAt: "2026-08-08", dueDate: "2026-12-22", assignedRep: "Shayla Hilliard", assignedDirector: "Primeau Hill Director", nextAction: "Resolve blocker", riskStatus: "green", vendor: "Badger Sport", vendorNotes: "Badger Sport order #TUF-2026013. Standard basketball order.", missingInfo: [] },
  { id: "ord-15", organizationId: "org-40", organizationName: "Bemidji HS", opportunityId: "opp-33", title: "Baseball Uniforms", sport: "Baseball", lane: "UNIFORM" as RevenueLane, value: 7107, quantity: 444, productionStatus: "COMPLETED", orderStage: "COMPLETED", createdDate: "2026-07-14", createdAt: "2026-07-14", updatedAt: "2026-07-14", dueDate: "2026-12-28", assignedRep: "Shayla Hilliard", assignedDirector: "Primeau Hill Director", nextAction: "Archive order", riskStatus: "green", vendor: "A4", vendorNotes: "A4 order #TUF-2026014. Standard baseball order.", missingInfo: [] },
  { id: "ord-16", organizationId: "org-81", organizationName: "Rochester Mayo", opportunityId: "opp-34", title: "Basketball Uniforms", sport: "Basketball", lane: "TRAVEL_GEAR" as RevenueLane, value: 13503, quantity: 1687, productionStatus: "IN_PRODUCTION", orderStage: "COMPLETED", createdDate: "2026-07-13", createdAt: "2026-07-13", updatedAt: "2026-07-13", dueDate: "2026-12-27", assignedRep: "Shayla Hilliard", assignedDirector: "Primeau Hill Director", nextAction: "Review production status", riskStatus: "green", vendor: "Eastbay", vendorNotes: "Eastbay order #TUF-2026015. Standard basketball order.", missingInfo: [] },
  { id: "ord-17", organizationId: "org-83", organizationName: "Apple Valley HS", opportunityId: "opp-35", title: "7v7 Flag Uniforms", sport: "7v7 Flag", lane: "TEAM_STORE" as RevenueLane, value: 10527, quantity: 1052, productionStatus: "BLOCKED", orderStage: "COMPLETED", createdDate: "2026-07-02", createdAt: "2026-07-02", updatedAt: "2026-07-02", dueDate: "2026-10-16", assignedRep: "Shayla Hilliard", assignedDirector: "Primeau Hill Director", nextAction: "Resolve blocker", riskStatus: "green", vendor: "BSN Sports", vendorNotes: "BSN Sports order #TUF-2026016. Standard 7v7 flag order.", missingInfo: [] },
  { id: "ord-18", organizationId: "org-82", organizationName: "Apple Valley HS", opportunityId: "opp-36", title: "Volleyball Uniforms", sport: "Volleyball", lane: "LETTERMAN" as RevenueLane, value: 9689, quantity: 807, productionStatus: "COMPLETED", orderStage: "COMPLETED", createdDate: "2026-07-08", createdAt: "2026-07-08", updatedAt: "2026-07-08", dueDate: "2026-12-22", assignedRep: "Shayla Hilliard", assignedDirector: "Primeau Hill Director", nextAction: "Archive order", riskStatus: "green", vendor: "Under Armour", vendorNotes: "Under Armour order #TUF-2026017. Standard volleyball order.", missingInfo: [] },
  { id: "ord-19", organizationId: "org-46", organizationName: "Bemidji HS", opportunityId: "opp-37", title: "Volleyball Uniforms", sport: "Volleyball", lane: "TRAVEL_GEAR" as RevenueLane, value: 5302, quantity: 378, productionStatus: "IN_PRODUCTION", orderStage: "SHIPPED_DELIVERED", createdDate: "2026-07-27", createdAt: "2026-07-27", updatedAt: "2026-07-27", dueDate: "2026-12-28", assignedRep: "Shayla Hilliard", assignedDirector: "Primeau Hill Director", nextAction: "Review production status", riskStatus: "green", vendor: "Nike Team", vendorNotes: "Nike Team order #TUF-2026018. Standard volleyball order.", missingInfo: [] },
  { id: "ord-20", organizationId: "org-61", organizationName: "Eden Prairie HS", opportunityId: "opp-38", title: "Hockey Uniforms", sport: "Hockey", lane: "UNIFORM" as RevenueLane, value: 6720, quantity: 420, productionStatus: "BLOCKED", orderStage: "SHIPPED_DELIVERED", createdDate: "2026-08-15", createdAt: "2026-08-15", updatedAt: "2026-08-15", dueDate: "2026-12-28", assignedRep: "Shayla Hilliard", assignedDirector: "Primeau Hill Director", nextAction: "Resolve blocker", riskStatus: "green", vendor: "Adidas", vendorNotes: "Adidas order #TUF-2026019. Standard hockey order.", missingInfo: [] },
  { id: "ord-21", organizationId: "org-10", organizationName: "Roseville HS", opportunityId: "opp-51", title: "7v7 Flag Uniforms", sport: "7v7 Flag", lane: "TRAVEL_GEAR" as RevenueLane, value: 16244, quantity: 2030, productionStatus: "COMPLETED", orderStage: "SHIPPED_DELIVERED", createdDate: "2026-07-06", createdAt: "2026-07-06", updatedAt: "2026-07-06", dueDate: "2026-12-20", assignedRep: "Jason Mulder", assignedDirector: "Test Director", nextAction: "Archive order", riskStatus: "green", vendor: "Champion", vendorNotes: "Champion order #TUF-2026020. Standard 7v7 flag order.", missingInfo: [] },
  { id: "ord-22", organizationId: "org-73", organizationName: "Rochester Mayo", opportunityId: "opp-52", title: "Basketball Uniforms", sport: "Basketball", lane: "TEAM_STORE" as RevenueLane, value: 12470, quantity: 1247, productionStatus: "IN_PRODUCTION", orderStage: "SHIPPED_DELIVERED", createdDate: "2026-07-20", createdAt: "2026-07-20", updatedAt: "2026-07-20", dueDate: "2026-12-28", assignedRep: "Jason Mulder", assignedDirector: "Test Director", nextAction: "Review production status", riskStatus: "green", vendor: "Badger Sport", vendorNotes: "Badger Sport order #TUF-2026021. Standard basketball order.", missingInfo: [] },
  { id: "ord-23", organizationId: "org-42", organizationName: "Prior Lake HS", opportunityId: "opp-53", title: "Volleyball Uniforms", sport: "Volleyball", lane: "UNIFORM" as RevenueLane, value: 14703, quantity: 1225, productionStatus: "BLOCKED", orderStage: "SHIPPED_DELIVERED", createdDate: "2026-07-17", createdAt: "2026-07-17", updatedAt: "2026-07-17", dueDate: "2026-12-28", assignedRep: "Jason Mulder", assignedDirector: "Test Director", nextAction: "Resolve blocker", riskStatus: "green", vendor: "A4", vendorNotes: "A4 order #TUF-2026022. Standard volleyball order.", missingInfo: [] },
  { id: "ord-24", organizationId: "org-61", organizationName: "Bemidji HS", opportunityId: "opp-54", title: "Football Uniforms", sport: "Football", lane: "TRAVEL_GEAR" as RevenueLane, value: 12425, quantity: 887, productionStatus: "COMPLETED", orderStage: "SHIPPED_DELIVERED", createdDate: "2026-07-29", createdAt: "2026-07-29", updatedAt: "2026-07-29", dueDate: "2026-12-28", assignedRep: "Jason Mulder", assignedDirector: "Test Director", nextAction: "Archive order", riskStatus: "green", vendor: "Eastbay", vendorNotes: "Eastbay order #TUF-2026023. Standard football order.", missingInfo: [] },
  { id: "ord-25", organizationId: "org-11", organizationName: "Chanhassen HS", opportunityId: "opp-55", title: "Baseball Uniforms", sport: "Baseball", lane: "LETTERMAN" as RevenueLane, value: 6124, quantity: 382, productionStatus: "IN_PRODUCTION", orderStage: "SHIPPED_DELIVERED", createdDate: "2026-08-15", createdAt: "2026-08-15", updatedAt: "2026-08-15", dueDate: "2026-12-28", assignedRep: "Jason Mulder", assignedDirector: "Test Director", nextAction: "Review production status", riskStatus: "green", vendor: "BSN Sports", vendorNotes: "BSN Sports order #TUF-2026024. Standard baseball order.", missingInfo: [] },
  { id: "ord-26", organizationId: "org-38", organizationName: "Minnetonka HS", opportunityId: "opp-56", title: "Football Uniforms", sport: "Football", lane: "LETTERMAN" as RevenueLane, value: 10522, quantity: 1315, productionStatus: "BLOCKED", orderStage: "SHIPPED_DELIVERED", createdDate: "2026-08-08", createdAt: "2026-08-08", updatedAt: "2026-08-08", dueDate: "2026-12-22", assignedRep: "Jason Mulder", assignedDirector: "Test Director", nextAction: "Resolve blocker", riskStatus: "yellow", vendor: "Under Armour", vendorNotes: "Under Armour order #TUF-2026025. Standard football order.", missingInfo: [] },
  { id: "ord-27", organizationId: "org-75", organizationName: "Shakopee HS", opportunityId: "opp-57", title: "Volleyball Uniforms", sport: "Volleyball", lane: "TEAM_STORE" as RevenueLane, value: 10236, quantity: 1023, productionStatus: "COMPLETED", orderStage: "SHIPPED_DELIVERED", createdDate: "2026-07-27", createdAt: "2026-07-27", updatedAt: "2026-07-27", dueDate: "2026-12-28", assignedRep: "Jason Mulder", assignedDirector: "Test Director", nextAction: "Archive order", riskStatus: "yellow", vendor: "Nike Team", vendorNotes: "Nike Team order #TUF-2026026. Standard volleyball order.", missingInfo: [] },
  { id: "ord-28", organizationId: "org-11", organizationName: "Roseville HS", opportunityId: "opp-58", title: "Baseball Uniforms", sport: "Baseball", lane: "UNIFORM" as RevenueLane, value: 8164, quantity: 680, productionStatus: "READY_FOR_VENDOR", orderStage: "SHIPPED_DELIVERED", createdDate: "2026-07-26", createdAt: "2026-07-26", updatedAt: "2026-07-26", dueDate: "2026-12-28", assignedRep: "Jason Mulder", assignedDirector: "Test Director", nextAction: "Review production status", riskStatus: "yellow", vendor: "Adidas", vendorNotes: "Adidas order #TUF-2026027. Standard baseball order.", missingInfo: [] },
  { id: "ord-29", organizationId: "org-66", organizationName: "Anoka HS", opportunityId: "opp-59", title: "Hockey Uniforms", sport: "Hockey", lane: "LETTERMAN" as RevenueLane, value: 8594, quantity: 613, productionStatus: "READY_FOR_VENDOR", orderStage: "SHIPPED_DELIVERED", createdDate: "2026-07-27", createdAt: "2026-07-27", updatedAt: "2026-07-27", dueDate: "2026-12-28", assignedRep: "Jason Mulder", assignedDirector: "Test Director", nextAction: "Review production status", riskStatus: "yellow", vendor: "Champion", vendorNotes: "Champion order #TUF-2026028. Standard hockey order.", missingInfo: [] },
  { id: "ord-30", organizationId: "org-75", organizationName: "Anoka HS", opportunityId: "opp-60", title: "Hockey Uniforms", sport: "Hockey", lane: "LETTERMAN" as RevenueLane, value: 16986, quantity: 1061, productionStatus: "READY_FOR_VENDOR", orderStage: "SHIPPED_DELIVERED", createdDate: "2026-08-21", createdAt: "2026-08-21", updatedAt: "2026-08-21", dueDate: "2026-12-28", assignedRep: "Jason Mulder", assignedDirector: "Test Director", nextAction: "Review production status", riskStatus: "yellow", vendor: "Badger Sport", vendorNotes: "Badger Sport order #TUF-2026029. Standard hockey order.", missingInfo: [] },
  { id: "ord-31", organizationId: "org-84", organizationName: "Anoka HS", opportunityId: "opp-76", title: "Football Uniforms", sport: "Football", lane: "LETTERMAN" as RevenueLane, value: 11319, quantity: 1414, productionStatus: "READY_FOR_VENDOR", orderStage: "QUALITY_CHECK", createdDate: "2026-07-19", createdAt: "2026-07-19", updatedAt: "2026-07-19", dueDate: "2026-12-28", assignedRep: "David Lundberg", assignedDirector: "Test Director", nextAction: "Review production status", riskStatus: "yellow", vendor: "A4", vendorNotes: "A4 order #TUF-2026030. Standard football order.", missingInfo: [] },
  { id: "ord-32", organizationId: "org-80", organizationName: "St. Cloud Tech", opportunityId: "opp-77", title: "Volleyball Uniforms", sport: "Volleyball", lane: "TRAVEL_GEAR" as RevenueLane, value: 10052, quantity: 1005, productionStatus: "READY_FOR_VENDOR", orderStage: "QUALITY_CHECK", createdDate: "2026-07-28", createdAt: "2026-07-28", updatedAt: "2026-07-28", dueDate: "2026-12-28", assignedRep: "David Lundberg", assignedDirector: "Test Director", nextAction: "Review production status", riskStatus: "yellow", vendor: "Eastbay", vendorNotes: "Eastbay order #TUF-2026031. Standard volleyball order.", missingInfo: [] },
  { id: "ord-33", organizationId: "org-76", organizationName: "Apple Valley HS", opportunityId: "opp-78", title: "Wrestling Uniforms", sport: "Wrestling", lane: "UNIFORM" as RevenueLane, value: 13303, quantity: 1108, productionStatus: "READY_FOR_VENDOR", orderStage: "QUALITY_CHECK", createdDate: "2026-08-08", createdAt: "2026-08-08", updatedAt: "2026-08-08", dueDate: "2026-12-22", assignedRep: "David Lundberg", assignedDirector: "Test Director", nextAction: "Review production status", riskStatus: "yellow", vendor: "BSN Sports", vendorNotes: "BSN Sports order #TUF-2026032. Standard wrestling order.", missingInfo: [] },
  { id: "ord-34", organizationId: "org-33", organizationName: "Shakopee HS", opportunityId: "opp-79", title: "7v7 Flag Uniforms", sport: "7v7 Flag", lane: "UNIFORM" as RevenueLane, value: 7272, quantity: 519, productionStatus: "READY_FOR_VENDOR", orderStage: "QUALITY_CHECK", createdDate: "2026-08-06", createdAt: "2026-08-06", updatedAt: "2026-08-06", dueDate: "2026-12-20", assignedRep: "David Lundberg", assignedDirector: "Test Director", nextAction: "Review production status", riskStatus: "yellow", vendor: "Under Armour", vendorNotes: "Under Armour order #TUF-2026033. Standard 7v7 flag order.", missingInfo: [] },
  { id: "ord-35", organizationId: "org-39", organizationName: "Hopkins HS", opportunityId: "opp-80", title: "Football Uniforms", sport: "Football", lane: "UNIFORM" as RevenueLane, value: 11354, quantity: 709, productionStatus: "READY_FOR_VENDOR", orderStage: "QUALITY_CHECK", createdDate: "2026-07-23", createdAt: "2026-07-23", updatedAt: "2026-07-23", dueDate: "2026-12-28", assignedRep: "David Lundberg", assignedDirector: "Test Director", nextAction: "Review production status", riskStatus: "yellow", vendor: "Nike Team", vendorNotes: "Nike Team order #TUF-2026034. Standard football order.", missingInfo: [] },
  { id: "ord-36", organizationId: "org-47", organizationName: "White Bear Lake HS", opportunityId: "opp-89", title: "Hockey Uniforms", sport: "Hockey", lane: "LETTERMAN" as RevenueLane, value: 5299, quantity: 662, productionStatus: "NEEDS_REVIEW", orderStage: "QUALITY_CHECK", createdDate: "2026-08-11", createdAt: "2026-08-11", updatedAt: "2026-08-11", dueDate: "2026-12-25", assignedRep: "Primeau Hill", assignedDirector: "Primeau Hill Director", nextAction: "Review production status", riskStatus: "yellow", vendor: "Adidas", vendorNotes: "Adidas order #TUF-2026035. Standard hockey order.", missingInfo: [] },
  { id: "ord-37", organizationId: "org-48", organizationName: "Moorhead HS", opportunityId: "opp-90", title: "Baseball Uniforms", sport: "Baseball", lane: "UNIFORM" as RevenueLane, value: 12744, quantity: 1274, productionStatus: "NEEDS_REVIEW", orderStage: "QUALITY_CHECK", createdDate: "2026-07-27", createdAt: "2026-07-27", updatedAt: "2026-07-27", dueDate: "2026-12-28", assignedRep: "Primeau Hill", assignedDirector: "Primeau Hill Director", nextAction: "Review production status", riskStatus: "yellow", vendor: "Champion", vendorNotes: "Champion order #TUF-2026036. Standard baseball order.", missingInfo: [] },
  { id: "ord-38", organizationId: "org-46", organizationName: "Maple Grove HS", opportunityId: "opp-91", title: "7v7 Flag Uniforms", sport: "7v7 Flag", lane: "TEAM_STORE" as RevenueLane, value: 17069, quantity: 1422, productionStatus: "NEEDS_REVIEW", orderStage: "QUALITY_CHECK", createdDate: "2026-07-10", createdAt: "2026-07-10", updatedAt: "2026-07-10", dueDate: "2026-12-24", assignedRep: "Primeau Hill", assignedDirector: "Primeau Hill Director", nextAction: "Review production status", riskStatus: "yellow", vendor: "Badger Sport", vendorNotes: "Badger Sport order #TUF-2026037. Standard 7v7 flag order.", missingInfo: [] },
  { id: "ord-39", organizationId: "org-38", organizationName: "Shakopee HS", opportunityId: "opp-92", title: "Basketball Uniforms", sport: "Basketball", lane: "TEAM_STORE" as RevenueLane, value: 9248, quantity: 660, productionStatus: "NEEDS_REVIEW", orderStage: "QUALITY_CHECK", createdDate: "2026-07-07", createdAt: "2026-07-07", updatedAt: "2026-07-07", dueDate: "2026-12-21", assignedRep: "Primeau Hill", assignedDirector: "Primeau Hill Director", nextAction: "Review production status", riskStatus: "gray", vendor: "A4", vendorNotes: "A4 order #TUF-2026038. Standard basketball order.", missingInfo: [] },
  { id: "ord-40", organizationId: "org-30", organizationName: "White Bear Lake HS", opportunityId: "opp-19", title: "Basketball Uniforms", sport: "Basketball", lane: "TRAVEL_GEAR" as RevenueLane, value: 9280, quantity: 580, productionStatus: "NEEDS_REVIEW", orderStage: "QUALITY_CHECK", createdDate: "2026-08-01", createdAt: "2026-08-01", updatedAt: "2026-08-01", dueDate: "2026-09-15", assignedRep: "Josh Hoffman", assignedDirector: "Primeau Hill Director", nextAction: "Review production status", riskStatus: "gray", vendor: "Eastbay", vendorNotes: "Eastbay order #TUF-2026039. Standard basketball order.", missingInfo: [] },
  { id: "ord-41", organizationId: "org-61", organizationName: "Bemidji HS", opportunityId: "opp-22", title: "Hockey Uniforms", sport: "Hockey", lane: "LETTERMAN" as RevenueLane, value: 16279, quantity: 2034, productionStatus: "NEEDS_REVIEW", orderStage: "IN_PRODUCTION", createdDate: "2026-08-16", createdAt: "2026-08-16", updatedAt: "2026-08-16", dueDate: "2026-12-28", assignedRep: "Josh Hoffman", assignedDirector: "Primeau Hill Director", nextAction: "Review production status", riskStatus: "gray", vendor: "BSN Sports", vendorNotes: "BSN Sports order #TUF-2026040. Standard hockey order.", missingInfo: [] },
  { id: "ord-42", organizationId: "org-1", organizationName: "St. Cloud Tech", opportunityId: "opp-25", title: "Football Uniforms", sport: "Football", lane: "UNIFORM" as RevenueLane, value: 12855, quantity: 1285, productionStatus: "NEEDS_REVIEW", orderStage: "IN_PRODUCTION", createdDate: "2026-08-10", createdAt: "2026-08-10", updatedAt: "2026-08-10", dueDate: "2026-12-24", assignedRep: "Josh Hoffman", assignedDirector: "Primeau Hill Director", nextAction: "Review production status", riskStatus: "gray", vendor: "Under Armour", vendorNotes: "Under Armour order #TUF-2026041. Standard football order.", missingInfo: [] },
  { id: "ord-43", organizationId: "org-20", organizationName: "Roseville HS", opportunityId: "opp-26", title: "7v7 Flag Uniforms", sport: "7v7 Flag", lane: "LETTERMAN" as RevenueLane, value: 13279, quantity: 1106, productionStatus: "NEEDS_REVIEW", orderStage: "IN_PRODUCTION", createdDate: "2026-08-07", createdAt: "2026-08-07", updatedAt: "2026-08-07", dueDate: "2026-12-21", assignedRep: "Josh Hoffman", assignedDirector: "Primeau Hill Director", nextAction: "Review production status", riskStatus: "gray", vendor: "Nike Team", vendorNotes: "Nike Team order #TUF-2026042. Standard 7v7 flag order.", missingInfo: [] },
  { id: "ord-44", organizationId: "org-76", organizationName: "Maple Grove HS", opportunityId: "opp-28", title: "7v7 Flag Uniforms", sport: "7v7 Flag", lane: "UNIFORM" as RevenueLane, value: 15900, quantity: 1135, productionStatus: "NEEDS_REVIEW", orderStage: "IN_PRODUCTION", createdDate: "2026-08-15", createdAt: "2026-08-15", updatedAt: "2026-08-15", dueDate: "2026-12-28", assignedRep: "Josh Hoffman", assignedDirector: "Primeau Hill Director", nextAction: "Review production status", riskStatus: "gray", vendor: "Adidas", vendorNotes: "Adidas order #TUF-2026043. Standard 7v7 flag order.", missingInfo: [] },
  { id: "ord-45", organizationId: "org-41", organizationName: "Edina HS", opportunityId: "opp-30", title: "Football Uniforms", sport: "Football", lane: "UNIFORM" as RevenueLane, value: 8573, quantity: 535, productionStatus: "NEEDS_REVIEW", orderStage: "IN_PRODUCTION", createdDate: "2026-08-17", createdAt: "2026-08-17", updatedAt: "2026-08-17", dueDate: "2026-12-28", assignedRep: "Josh Hoffman", assignedDirector: "Primeau Hill Director", nextAction: "Review production status", riskStatus: "gray", vendor: "Champion", vendorNotes: "Champion order #TUF-2026044. Standard football order.", missingInfo: [] },
];
export const activities: Activity[] = [
  { id: "act-1", entityType: "OPPORTUNITY", entityId: "opp-1", message: "Discovery call completed", timestamp: "2026-06-01", user: "Josh Hoffman" },
  { id: "act-2", entityType: "ORGANIZATION", entityId: "org-27", message: "Email sent introducing TUF Ops", timestamp: "2026-06-02", user: "Shayla Hilliard" },
  { id: "act-3", entityType: "ORDER", entityId: "ord-3", message: "Artwork files received", timestamp: "2026-06-03", user: "Jason Mulder" },
  { id: "act-4", entityType: "OPPORTUNITY", entityId: "opp-4", message: "Left voicemail - will try again", timestamp: "2026-06-04", user: "David Lundberg" },
  { id: "act-5", entityType: "ORGANIZATION", entityId: "org-29", message: "Account review completed", timestamp: "2026-06-05", user: "Primeau Hill" },
  { id: "act-6", entityType: "ORDER", entityId: "ord-6", message: "Quality check passed", timestamp: "2026-06-06", user: "Josh Hoffman" },
  { id: "act-7", entityType: "OPPORTUNITY", entityId: "opp-7", message: "Invoice sent - awaiting payment", timestamp: "2026-06-07", user: "Shayla Hilliard" },
  { id: "act-8", entityType: "ORGANIZATION", entityId: "org-77", message: "Sent marketing materials", timestamp: "2026-06-08", user: "Jason Mulder" },
  { id: "act-9", entityType: "ORDER", entityId: "ord-9", message: "Order completed and archived", timestamp: "2026-06-09", user: "David Lundberg" },
  { id: "act-10", entityType: "OPPORTUNITY", entityId: "opp-10", message: "Revised quote delivered", timestamp: "2026-06-10", user: "Primeau Hill" },
  { id: "act-11", entityType: "ORGANIZATION", entityId: "org-40", message: "Prospecting call to athletic department", timestamp: "2026-06-11", user: "Josh Hoffman" },
  { id: "act-12", entityType: "ORDER", entityId: "ord-12", message: "Payment confirmed", timestamp: "2026-06-12", user: "Shayla Hilliard" },
  { id: "act-13", entityType: "OPPORTUNITY", entityId: "opp-13", message: "Meeting set for next week", timestamp: "2026-06-13", user: "Jason Mulder" },
  { id: "act-14", entityType: "ORGANIZATION", entityId: "org-56", message: "Connected with head coach", timestamp: "2026-06-14", user: "David Lundberg" },
  { id: "act-15", entityType: "ORDER", entityId: "ord-15", message: "Production update received", timestamp: "2026-06-15", user: "Primeau Hill" },
  { id: "act-16", entityType: "OPPORTUNITY", entityId: "opp-16", message: "Awaiting board approval", timestamp: "2026-06-16", user: "Josh Hoffman" },
  { id: "act-17", entityType: "ORGANIZATION", entityId: "org-61", message: "Territory research done", timestamp: "2026-06-17", user: "Shayla Hilliard" },
  { id: "act-18", entityType: "ORDER", entityId: "ord-18", message: "Delivery confirmed", timestamp: "2026-06-18", user: "Jason Mulder" },
  { id: "act-19", entityType: "OPPORTUNITY", entityId: "opp-19", message: "Sports calendar reviewed", timestamp: "2026-06-19", user: "David Lundberg" },
  { id: "act-20", entityType: "ORGANIZATION", entityId: "org-10", message: "Reviewed account history", timestamp: "2026-06-20", user: "Primeau Hill" },
  { id: "act-21", entityType: "ORDER", entityId: "ord-21", message: "Order created in system", timestamp: "2026-06-21", user: "Josh Hoffman" },
  { id: "act-22", entityType: "OPPORTUNITY", entityId: "opp-22", message: "Sent proposal and pricing", timestamp: "2026-06-22", user: "Shayla Hilliard" },
  { id: "act-23", entityType: "ORGANIZATION", entityId: "org-38", message: "Left brochure with front office", timestamp: "2026-06-23", user: "Jason Mulder" },
  { id: "act-24", entityType: "ORDER", entityId: "ord-24", message: "Sent to vendor for production", timestamp: "2026-06-24", user: "David Lundberg" },
  { id: "act-25", entityType: "OPPORTUNITY", entityId: "opp-25", message: "Demo completed with AD", timestamp: "2026-06-25", user: "Primeau Hill" },
  { id: "act-26", entityType: "ORGANIZATION", entityId: "org-80", message: "Updated contact information", timestamp: "2026-06-26", user: "Josh Hoffman" },
  { id: "act-27", entityType: "ORDER", entityId: "ord-27", message: "Shipped to customer", timestamp: "2026-06-27", user: "Shayla Hilliard" },
  { id: "act-28", entityType: "OPPORTUNITY", entityId: "opp-28", message: "Payment received", timestamp: "2026-06-28", user: "Jason Mulder" },
  { id: "act-29", entityType: "ORGANIZATION", entityId: "org-48", message: "Annual check-in call", timestamp: "2026-06-01", user: "David Lundberg" },
  { id: "act-30", entityType: "ORDER", entityId: "ord-30", message: "Customer satisfaction follow-up", timestamp: "2026-06-02", user: "Primeau Hill" },
  { id: "act-31", entityType: "OPPORTUNITY", entityId: "opp-31", message: "Initial contact made", timestamp: "2026-06-03", user: "Josh Hoffman" },
  { id: "act-32", entityType: "ORGANIZATION", entityId: "org-20", message: "Email sent introducing TUF Ops", timestamp: "2026-06-04", user: "Shayla Hilliard" },
  { id: "act-33", entityType: "ORDER", entityId: "ord-33", message: "Artwork files received", timestamp: "2026-06-05", user: "Jason Mulder" },
  { id: "act-34", entityType: "OPPORTUNITY", entityId: "opp-34", message: "Presented to athletic director", timestamp: "2026-06-06", user: "David Lundberg" },
  { id: "act-35", entityType: "ORGANIZATION", entityId: "org-22", message: "Account review completed", timestamp: "2026-06-07", user: "Primeau Hill" },
  { id: "act-36", entityType: "ORDER", entityId: "ord-36", message: "Quality check passed", timestamp: "2026-06-08", user: "Josh Hoffman" },
  { id: "act-37", entityType: "OPPORTUNITY", entityId: "opp-37", message: "Sent contract for signature", timestamp: "2026-06-09", user: "Shayla Hilliard" },
  { id: "act-38", entityType: "ORGANIZATION", entityId: "org-15", message: "Sent marketing materials", timestamp: "2026-06-10", user: "Jason Mulder" },
  { id: "act-39", entityType: "ORDER", entityId: "ord-39", message: "Order completed and archived", timestamp: "2026-06-11", user: "David Lundberg" },
  { id: "act-40", entityType: "OPPORTUNITY", entityId: "opp-40", message: "Discussed timeline and budget", timestamp: "2026-06-12", user: "Primeau Hill" },
  { id: "act-41", entityType: "ORGANIZATION", entityId: "org-67", message: "Prospecting call to athletic department", timestamp: "2026-06-13", user: "Josh Hoffman" },
  { id: "act-42", entityType: "ORDER", entityId: "ord-42", message: "Payment confirmed", timestamp: "2026-06-14", user: "Shayla Hilliard" },
  { id: "act-43", entityType: "OPPORTUNITY", entityId: "opp-43", message: "Follow-up call scheduled", timestamp: "2026-06-15", user: "Jason Mulder" },
  { id: "act-44", entityType: "ORGANIZATION", entityId: "org-13", message: "Connected with head coach", timestamp: "2026-06-16", user: "David Lundberg" },
  { id: "act-45", entityType: "ORDER", entityId: "ord-45", message: "Production update received", timestamp: "2026-06-17", user: "Primeau Hill" },
  { id: "act-46", entityType: "OPPORTUNITY", entityId: "opp-46", message: "Mockup requested by coach", timestamp: "2026-06-18", user: "Josh Hoffman" },
  { id: "act-47", entityType: "ORGANIZATION", entityId: "org-6", message: "Territory research done", timestamp: "2026-06-19", user: "Shayla Hilliard" },
  { id: "act-48", entityType: "ORDER", entityId: "ord-3", message: "Delivery confirmed", timestamp: "2026-06-20", user: "Jason Mulder" },
  { id: "act-49", entityType: "OPPORTUNITY", entityId: "opp-49", message: "Artwork approved", timestamp: "2026-06-21", user: "David Lundberg" },
  { id: "act-50", entityType: "ORGANIZATION", entityId: "org-14", message: "Reviewed account history", timestamp: "2026-06-22", user: "Primeau Hill" },
  { id: "act-51", entityType: "ORDER", entityId: "ord-6", message: "Order created in system", timestamp: "2026-06-23", user: "Josh Hoffman" },
  { id: "act-52", entityType: "OPPORTUNITY", entityId: "opp-52", message: "Coach requested samples", timestamp: "2026-06-24", user: "Shayla Hilliard" },
  { id: "act-53", entityType: "ORGANIZATION", entityId: "org-49", message: "Left brochure with front office", timestamp: "2026-06-25", user: "Jason Mulder" },
  { id: "act-54", entityType: "ORDER", entityId: "ord-9", message: "Sent to vendor for production", timestamp: "2026-06-26", user: "David Lundberg" },
  { id: "act-55", entityType: "OPPORTUNITY", entityId: "opp-55", message: "Negotiating terms", timestamp: "2026-06-27", user: "Primeau Hill" },
  { id: "act-56", entityType: "ORGANIZATION", entityId: "org-4", message: "Updated contact information", timestamp: "2026-06-28", user: "Josh Hoffman" },
  { id: "act-57", entityType: "ORDER", entityId: "ord-12", message: "Shipped to customer", timestamp: "2026-06-01", user: "Shayla Hilliard" },
  { id: "act-58", entityType: "OPPORTUNITY", entityId: "opp-58", message: "Proposal accepted - moving to mockup", timestamp: "2026-06-02", user: "Jason Mulder" },
  { id: "act-59", entityType: "ORGANIZATION", entityId: "org-8", message: "Annual check-in call", timestamp: "2026-06-03", user: "David Lundberg" },
  { id: "act-60", entityType: "ORDER", entityId: "ord-15", message: "Customer satisfaction follow-up", timestamp: "2026-06-04", user: "Primeau Hill" },
  { id: "act-61", entityType: "OPPORTUNITY", entityId: "opp-61", message: "Discovery call completed", timestamp: "2026-06-05", user: "Josh Hoffman" },
  { id: "act-62", entityType: "ORGANIZATION", entityId: "org-12", message: "Email sent introducing TUF Ops", timestamp: "2026-06-06", user: "Shayla Hilliard" },
  { id: "act-63", entityType: "ORDER", entityId: "ord-18", message: "Artwork files received", timestamp: "2026-06-07", user: "Jason Mulder" },
  { id: "act-64", entityType: "OPPORTUNITY", entityId: "opp-64", message: "Left voicemail - will try again", timestamp: "2026-06-08", user: "David Lundberg" },
  { id: "act-65", entityType: "ORGANIZATION", entityId: "org-86", message: "Account review completed", timestamp: "2026-06-09", user: "Primeau Hill" },
  { id: "act-66", entityType: "ORDER", entityId: "ord-21", message: "Quality check passed", timestamp: "2026-06-10", user: "Josh Hoffman" },
  { id: "act-67", entityType: "OPPORTUNITY", entityId: "opp-67", message: "Invoice sent - awaiting payment", timestamp: "2026-06-11", user: "Shayla Hilliard" },
  { id: "act-68", entityType: "ORGANIZATION", entityId: "org-94", message: "Sent marketing materials", timestamp: "2026-06-12", user: "Jason Mulder" },
  { id: "act-69", entityType: "ORDER", entityId: "ord-24", message: "Order completed and archived", timestamp: "2026-06-13", user: "David Lundberg" },
  { id: "act-70", entityType: "OPPORTUNITY", entityId: "opp-70", message: "Revised quote delivered", timestamp: "2026-06-14", user: "Primeau Hill" },
  { id: "act-71", entityType: "ORGANIZATION", entityId: "org-60", message: "Prospecting call to athletic department", timestamp: "2026-06-15", user: "Josh Hoffman" },
  { id: "act-72", entityType: "ORDER", entityId: "ord-27", message: "Payment confirmed", timestamp: "2026-06-16", user: "Shayla Hilliard" },
  { id: "act-73", entityType: "OPPORTUNITY", entityId: "opp-73", message: "Meeting set for next week", timestamp: "2026-06-17", user: "Jason Mulder" },
  { id: "act-74", entityType: "ORGANIZATION", entityId: "org-47", message: "Connected with head coach", timestamp: "2026-07-18", user: "David Lundberg" },
  { id: "act-75", entityType: "ORDER", entityId: "ord-30", message: "Production update received", timestamp: "2026-07-19", user: "Primeau Hill" },
  { id: "act-76", entityType: "OPPORTUNITY", entityId: "opp-76", message: "Awaiting board approval", timestamp: "2026-07-20", user: "Josh Hoffman" },
  { id: "act-77", entityType: "ORGANIZATION", entityId: "org-84", message: "Territory research done", timestamp: "2026-07-21", user: "Shayla Hilliard" },
  { id: "act-78", entityType: "ORDER", entityId: "ord-33", message: "Delivery confirmed", timestamp: "2026-07-22", user: "Jason Mulder" },
  { id: "act-79", entityType: "OPPORTUNITY", entityId: "opp-79", message: "Sports calendar reviewed", timestamp: "2026-07-23", user: "David Lundberg" },
  { id: "act-80", entityType: "ORGANIZATION", entityId: "org-46", message: "Reviewed account history", timestamp: "2026-07-24", user: "Primeau Hill" },
  { id: "act-81", entityType: "ORDER", entityId: "ord-36", message: "Order created in system", timestamp: "2026-07-25", user: "Josh Hoffman" },
  { id: "act-82", entityType: "OPPORTUNITY", entityId: "opp-82", message: "Sent proposal and pricing", timestamp: "2026-07-26", user: "Shayla Hilliard" },
  { id: "act-83", entityType: "ORGANIZATION", entityId: "org-75", message: "Left brochure with front office", timestamp: "2026-07-27", user: "Jason Mulder" },
  { id: "act-84", entityType: "ORDER", entityId: "ord-39", message: "Sent to vendor for production", timestamp: "2026-07-28", user: "David Lundberg" },
  { id: "act-85", entityType: "OPPORTUNITY", entityId: "opp-85", message: "Demo completed with AD", timestamp: "2026-07-01", user: "Primeau Hill" },
  { id: "act-86", entityType: "ORGANIZATION", entityId: "org-42", message: "Updated contact information", timestamp: "2026-07-02", user: "Josh Hoffman" },
  { id: "act-87", entityType: "ORDER", entityId: "ord-42", message: "Shipped to customer", timestamp: "2026-07-03", user: "Shayla Hilliard" },
  { id: "act-88", entityType: "OPPORTUNITY", entityId: "opp-88", message: "Payment received", timestamp: "2026-07-04", user: "Jason Mulder" },
  { id: "act-89", entityType: "ORGANIZATION", entityId: "org-66", message: "Annual check-in call", timestamp: "2026-07-05", user: "David Lundberg" },
  { id: "act-90", entityType: "ORDER", entityId: "ord-45", message: "Customer satisfaction follow-up", timestamp: "2026-07-06", user: "Primeau Hill" },
  { id: "act-91", entityType: "OPPORTUNITY", entityId: "opp-91", message: "Initial contact made", timestamp: "2026-07-07", user: "Josh Hoffman" },
  { id: "act-92", entityType: "ORGANIZATION", entityId: "org-39", message: "Email sent introducing TUF Ops", timestamp: "2026-07-08", user: "Shayla Hilliard" },
  { id: "act-93", entityType: "ORDER", entityId: "ord-3", message: "Artwork files received", timestamp: "2026-07-09", user: "Jason Mulder" },
  { id: "act-94", entityType: "OPPORTUNITY", entityId: "opp-94", message: "Presented to athletic director", timestamp: "2026-07-10", user: "David Lundberg" },
  { id: "act-95", entityType: "ORGANIZATION", entityId: "org-1", message: "Account review completed", timestamp: "2026-07-11", user: "Primeau Hill" },
  { id: "act-96", entityType: "ORDER", entityId: "ord-6", message: "Quality check passed", timestamp: "2026-07-12", user: "Josh Hoffman" },
  { id: "act-97", entityType: "OPPORTUNITY", entityId: "opp-97", message: "Sent contract for signature", timestamp: "2026-07-13", user: "Shayla Hilliard" },
  { id: "act-98", entityType: "ORGANIZATION", entityId: "org-7", message: "Sent marketing materials", timestamp: "2026-07-14", user: "Jason Mulder" },
  { id: "act-99", entityType: "ORDER", entityId: "ord-9", message: "Order completed and archived", timestamp: "2026-07-15", user: "David Lundberg" },
  { id: "act-100", entityType: "OPPORTUNITY", entityId: "opp-100", message: "Discussed timeline and budget", timestamp: "2026-07-16", user: "Primeau Hill" },
  { id: "act-101", entityType: "ORGANIZATION", entityId: "org-87", message: "Prospecting call to athletic department", timestamp: "2026-07-17", user: "Josh Hoffman" },
  { id: "act-102", entityType: "ORDER", entityId: "ord-12", message: "Payment confirmed", timestamp: "2026-07-18", user: "Shayla Hilliard" },
  { id: "act-103", entityType: "OPPORTUNITY", entityId: "opp-1", message: "Follow-up call scheduled", timestamp: "2026-07-19", user: "Jason Mulder" },
  { id: "act-104", entityType: "ORGANIZATION", entityId: "org-18", message: "Connected with head coach", timestamp: "2026-07-20", user: "David Lundberg" },
  { id: "act-105", entityType: "ORDER", entityId: "ord-15", message: "Production update received", timestamp: "2026-07-21", user: "Primeau Hill" },
  { id: "act-106", entityType: "OPPORTUNITY", entityId: "opp-4", message: "Mockup requested by coach", timestamp: "2026-07-22", user: "Josh Hoffman" },
  { id: "act-107", entityType: "ORGANIZATION", entityId: "org-69", message: "Territory research done", timestamp: "2026-07-23", user: "Shayla Hilliard" },
  { id: "act-108", entityType: "ORDER", entityId: "ord-18", message: "Delivery confirmed", timestamp: "2026-07-24", user: "Jason Mulder" },
  { id: "act-109", entityType: "OPPORTUNITY", entityId: "opp-7", message: "Artwork approved", timestamp: "2026-07-25", user: "David Lundberg" },
  { id: "act-110", entityType: "ORGANIZATION", entityId: "org-25", message: "Reviewed account history", timestamp: "2026-07-26", user: "Primeau Hill" },
  { id: "act-111", entityType: "ORDER", entityId: "ord-21", message: "Order created in system", timestamp: "2026-07-27", user: "Josh Hoffman" },
  { id: "act-112", entityType: "OPPORTUNITY", entityId: "opp-10", message: "Coach requested samples", timestamp: "2026-07-28", user: "Shayla Hilliard" },
  { id: "act-113", entityType: "ORGANIZATION", entityId: "org-68", message: "Left brochure with front office", timestamp: "2026-07-01", user: "Jason Mulder" },
  { id: "act-114", entityType: "ORDER", entityId: "ord-24", message: "Sent to vendor for production", timestamp: "2026-07-02", user: "David Lundberg" },
  { id: "act-115", entityType: "OPPORTUNITY", entityId: "opp-13", message: "Negotiating terms", timestamp: "2026-07-03", user: "Primeau Hill" },
  { id: "act-116", entityType: "ORGANIZATION", entityId: "org-9", message: "Updated contact information", timestamp: "2026-07-04", user: "Josh Hoffman" },
  { id: "act-117", entityType: "ORDER", entityId: "ord-27", message: "Shipped to customer", timestamp: "2026-07-05", user: "Shayla Hilliard" },
  { id: "act-118", entityType: "OPPORTUNITY", entityId: "opp-16", message: "Proposal accepted - moving to mockup", timestamp: "2026-07-06", user: "Jason Mulder" },
  { id: "act-119", entityType: "ORGANIZATION", entityId: "org-90", message: "Annual check-in call", timestamp: "2026-07-07", user: "David Lundberg" },
  { id: "act-120", entityType: "ORDER", entityId: "ord-30", message: "Customer satisfaction follow-up", timestamp: "2026-07-08", user: "Primeau Hill" },
  { id: "act-121", entityType: "OPPORTUNITY", entityId: "opp-19", message: "Discovery call completed", timestamp: "2026-07-09", user: "Josh Hoffman" },
  { id: "act-122", entityType: "ORGANIZATION", entityId: "org-51", message: "Email sent introducing TUF Ops", timestamp: "2026-07-10", user: "Shayla Hilliard" },
  { id: "act-123", entityType: "ORDER", entityId: "ord-33", message: "Artwork files received", timestamp: "2026-07-11", user: "Jason Mulder" },
  { id: "act-124", entityType: "OPPORTUNITY", entityId: "opp-22", message: "Left voicemail - will try again", timestamp: "2026-07-12", user: "David Lundberg" },
  { id: "act-125", entityType: "ORGANIZATION", entityId: "org-94", message: "Account review completed", timestamp: "2026-07-13", user: "Primeau Hill" },
  { id: "act-126", entityType: "ORDER", entityId: "ord-36", message: "Quality check passed", timestamp: "2026-07-14", user: "Josh Hoffman" },
  { id: "act-127", entityType: "OPPORTUNITY", entityId: "opp-25", message: "Invoice sent - awaiting payment", timestamp: "2026-07-15", user: "Shayla Hilliard" },
  { id: "act-128", entityType: "ORGANIZATION", entityId: "org-5", message: "Sent marketing materials", timestamp: "2026-07-16", user: "Jason Mulder" },
  { id: "act-129", entityType: "ORDER", entityId: "ord-39", message: "Order completed and archived", timestamp: "2026-07-17", user: "David Lundberg" },
  { id: "act-130", entityType: "OPPORTUNITY", entityId: "opp-28", message: "Revised quote delivered", timestamp: "2026-07-18", user: "Primeau Hill" },
  { id: "act-131", entityType: "ORGANIZATION", entityId: "org-24", message: "Prospecting call to athletic department", timestamp: "2026-07-19", user: "Josh Hoffman" },
  { id: "act-132", entityType: "ORDER", entityId: "ord-42", message: "Payment confirmed", timestamp: "2026-07-20", user: "Shayla Hilliard" },
  { id: "act-133", entityType: "OPPORTUNITY", entityId: "opp-31", message: "Meeting set for next week", timestamp: "2026-07-21", user: "Jason Mulder" },
  { id: "act-134", entityType: "ORGANIZATION", entityId: "org-17", message: "Connected with head coach", timestamp: "2026-07-22", user: "David Lundberg" },
  { id: "act-135", entityType: "ORDER", entityId: "ord-45", message: "Production update received", timestamp: "2026-07-23", user: "Primeau Hill" },
  { id: "act-136", entityType: "OPPORTUNITY", entityId: "opp-34", message: "Awaiting board approval", timestamp: "2026-07-24", user: "Josh Hoffman" },
  { id: "act-137", entityType: "ORGANIZATION", entityId: "org-33", message: "Territory research done", timestamp: "2026-07-25", user: "Shayla Hilliard" },
  { id: "act-138", entityType: "ORDER", entityId: "ord-3", message: "Delivery confirmed", timestamp: "2026-07-26", user: "Jason Mulder" },
  { id: "act-139", entityType: "OPPORTUNITY", entityId: "opp-37", message: "Sports calendar reviewed", timestamp: "2026-07-27", user: "David Lundberg" },
  { id: "act-140", entityType: "ORGANIZATION", entityId: "org-81", message: "Reviewed account history", timestamp: "2026-07-28", user: "Primeau Hill" },
  { id: "act-141", entityType: "ORDER", entityId: "ord-6", message: "Order created in system", timestamp: "2026-07-01", user: "Josh Hoffman" },
  { id: "act-142", entityType: "OPPORTUNITY", entityId: "opp-40", message: "Sent proposal and pricing", timestamp: "2026-07-02", user: "Shayla Hilliard" },
  { id: "act-143", entityType: "ORGANIZATION", entityId: "org-82", message: "Left brochure with front office", timestamp: "2026-07-03", user: "Jason Mulder" },
  { id: "act-144", entityType: "ORDER", entityId: "ord-9", message: "Sent to vendor for production", timestamp: "2026-07-04", user: "David Lundberg" },
  { id: "act-145", entityType: "OPPORTUNITY", entityId: "opp-43", message: "Demo completed with AD", timestamp: "2026-07-05", user: "Primeau Hill" },
  { id: "act-146", entityType: "ORGANIZATION", entityId: "org-83", message: "Updated contact information", timestamp: "2026-07-06", user: "Josh Hoffman" },
  { id: "act-147", entityType: "ORDER", entityId: "ord-12", message: "Shipped to customer", timestamp: "2026-08-07", user: "Shayla Hilliard" },
  { id: "act-148", entityType: "OPPORTUNITY", entityId: "opp-46", message: "Payment received", timestamp: "2026-08-08", user: "Jason Mulder" },
  { id: "act-149", entityType: "ORGANIZATION", entityId: "org-73", message: "Annual check-in call", timestamp: "2026-08-09", user: "David Lundberg" },
  { id: "act-150", entityType: "ORDER", entityId: "ord-15", message: "Customer satisfaction follow-up", timestamp: "2026-08-10", user: "Primeau Hill" },
  { id: "act-151", entityType: "OPPORTUNITY", entityId: "opp-49", message: "Initial contact made", timestamp: "2026-08-11", user: "Josh Hoffman" },
  { id: "act-152", entityType: "ORGANIZATION", entityId: "org-11", message: "Email sent introducing TUF Ops", timestamp: "2026-08-12", user: "Shayla Hilliard" },
  { id: "act-153", entityType: "ORDER", entityId: "ord-18", message: "Artwork files received", timestamp: "2026-08-13", user: "Jason Mulder" },
  { id: "act-154", entityType: "OPPORTUNITY", entityId: "opp-52", message: "Presented to athletic director", timestamp: "2026-08-14", user: "David Lundberg" },
  { id: "act-155", entityType: "ORGANIZATION", entityId: "org-76", message: "Account review completed", timestamp: "2026-08-15", user: "Primeau Hill" },
  { id: "act-156", entityType: "ORDER", entityId: "ord-21", message: "Quality check passed", timestamp: "2026-08-16", user: "Josh Hoffman" },
  { id: "act-157", entityType: "OPPORTUNITY", entityId: "opp-55", message: "Sent contract for signature", timestamp: "2026-08-17", user: "Shayla Hilliard" },
  { id: "act-158", entityType: "ORGANIZATION", entityId: "org-30", message: "Sent marketing materials", timestamp: "2026-08-18", user: "Jason Mulder" },
  { id: "act-159", entityType: "ORDER", entityId: "ord-24", message: "Order completed and archived", timestamp: "2026-08-19", user: "David Lundberg" },
  { id: "act-160", entityType: "OPPORTUNITY", entityId: "opp-58", message: "Discussed timeline and budget", timestamp: "2026-08-20", user: "Primeau Hill" },
  { id: "act-161", entityType: "ORGANIZATION", entityId: "org-41", message: "Prospecting call to athletic department", timestamp: "2026-08-21", user: "Josh Hoffman" },
  { id: "act-162", entityType: "ORDER", entityId: "ord-27", message: "Payment confirmed", timestamp: "2026-08-22", user: "Shayla Hilliard" },
  { id: "act-163", entityType: "OPPORTUNITY", entityId: "opp-61", message: "Follow-up call scheduled", timestamp: "2026-08-23", user: "Jason Mulder" },
  { id: "act-164", entityType: "ORGANIZATION", entityId: "org-31", message: "Connected with head coach", timestamp: "2026-08-24", user: "David Lundberg" },
  { id: "act-165", entityType: "ORDER", entityId: "ord-30", message: "Production update received", timestamp: "2026-08-25", user: "Primeau Hill" },
  { id: "act-166", entityType: "OPPORTUNITY", entityId: "opp-64", message: "Mockup requested by coach", timestamp: "2026-08-26", user: "Josh Hoffman" },
  { id: "act-167", entityType: "ORGANIZATION", entityId: "org-55", message: "Territory research done", timestamp: "2026-08-27", user: "Shayla Hilliard" },
  { id: "act-168", entityType: "ORDER", entityId: "ord-33", message: "Delivery confirmed", timestamp: "2026-08-28", user: "Jason Mulder" },
  { id: "act-169", entityType: "OPPORTUNITY", entityId: "opp-67", message: "Artwork approved", timestamp: "2026-08-01", user: "David Lundberg" },
  { id: "act-170", entityType: "ORGANIZATION", entityId: "org-2", message: "Reviewed account history", timestamp: "2026-08-02", user: "Primeau Hill" },
  { id: "act-171", entityType: "ORDER", entityId: "ord-36", message: "Order created in system", timestamp: "2026-08-03", user: "Josh Hoffman" },
  { id: "act-172", entityType: "OPPORTUNITY", entityId: "opp-70", message: "Coach requested samples", timestamp: "2026-08-04", user: "Shayla Hilliard" },
  { id: "act-173", entityType: "ORGANIZATION", entityId: "org-74", message: "Left brochure with front office", timestamp: "2026-08-05", user: "Jason Mulder" },
  { id: "act-174", entityType: "ORDER", entityId: "ord-39", message: "Sent to vendor for production", timestamp: "2026-08-06", user: "David Lundberg" },
  { id: "act-175", entityType: "OPPORTUNITY", entityId: "opp-73", message: "Negotiating terms", timestamp: "2026-08-07", user: "Primeau Hill" },
  { id: "act-176", entityType: "ORGANIZATION", entityId: "org-28", message: "Updated contact information", timestamp: "2026-08-08", user: "Josh Hoffman" },
  { id: "act-177", entityType: "ORDER", entityId: "ord-42", message: "Shipped to customer", timestamp: "2026-08-09", user: "Shayla Hilliard" },
  { id: "act-178", entityType: "OPPORTUNITY", entityId: "opp-76", message: "Proposal accepted - moving to mockup", timestamp: "2026-08-10", user: "Jason Mulder" },
  { id: "act-179", entityType: "ORGANIZATION", entityId: "org-21", message: "Annual check-in call", timestamp: "2026-08-11", user: "David Lundberg" },
  { id: "act-180", entityType: "ORDER", entityId: "ord-45", message: "Customer satisfaction follow-up", timestamp: "2026-08-12", user: "Primeau Hill" },
  { id: "act-181", entityType: "OPPORTUNITY", entityId: "opp-79", message: "Discovery call completed", timestamp: "2026-08-13", user: "Josh Hoffman" },
  { id: "act-182", entityType: "ORGANIZATION", entityId: "org-26", message: "Email sent introducing TUF Ops", timestamp: "2026-08-14", user: "Shayla Hilliard" },
  { id: "act-183", entityType: "ORDER", entityId: "ord-3", message: "Artwork files received", timestamp: "2026-08-15", user: "Jason Mulder" },
  { id: "act-184", entityType: "OPPORTUNITY", entityId: "opp-82", message: "Left voicemail - will try again", timestamp: "2026-08-16", user: "David Lundberg" },
  { id: "act-185", entityType: "ORGANIZATION", entityId: "org-43", message: "Account review completed", timestamp: "2026-08-17", user: "Primeau Hill" },
  { id: "act-186", entityType: "ORDER", entityId: "ord-6", message: "Quality check passed", timestamp: "2026-08-18", user: "Josh Hoffman" },
  { id: "act-187", entityType: "OPPORTUNITY", entityId: "opp-85", message: "Invoice sent - awaiting payment", timestamp: "2026-08-19", user: "Shayla Hilliard" },
  { id: "act-188", entityType: "ORGANIZATION", entityId: "org-92", message: "Sent marketing materials", timestamp: "2026-08-20", user: "Jason Mulder" },
  { id: "act-189", entityType: "ORDER", entityId: "ord-9", message: "Order completed and archived", timestamp: "2026-08-21", user: "David Lundberg" },
  { id: "act-190", entityType: "OPPORTUNITY", entityId: "opp-88", message: "Revised quote delivered", timestamp: "2026-08-22", user: "Primeau Hill" },
  { id: "act-191", entityType: "ORGANIZATION", entityId: "org-3", message: "Prospecting call to athletic department", timestamp: "2026-08-23", user: "Josh Hoffman" },
  { id: "act-192", entityType: "ORDER", entityId: "ord-12", message: "Payment confirmed", timestamp: "2026-08-24", user: "Shayla Hilliard" },
  { id: "act-193", entityType: "OPPORTUNITY", entityId: "opp-91", message: "Meeting set for next week", timestamp: "2026-08-25", user: "Jason Mulder" },
  { id: "act-194", entityType: "ORGANIZATION", entityId: "org-27", message: "Connected with head coach", timestamp: "2026-08-26", user: "David Lundberg" },
  { id: "act-195", entityType: "ORDER", entityId: "ord-15", message: "Production update received", timestamp: "2026-08-27", user: "Primeau Hill" },
  { id: "act-196", entityType: "OPPORTUNITY", entityId: "opp-94", message: "Awaiting board approval", timestamp: "2026-08-28", user: "Josh Hoffman" },
  { id: "act-197", entityType: "ORGANIZATION", entityId: "org-29", message: "Territory research done", timestamp: "2026-08-01", user: "Shayla Hilliard" },
  { id: "act-198", entityType: "ORDER", entityId: "ord-18", message: "Delivery confirmed", timestamp: "2026-08-02", user: "Jason Mulder" },
  { id: "act-199", entityType: "OPPORTUNITY", entityId: "opp-97", message: "Sports calendar reviewed", timestamp: "2026-08-03", user: "David Lundberg" },
  { id: "act-200", entityType: "ORGANIZATION", entityId: "org-77", message: "Reviewed account history", timestamp: "2026-08-04", user: "Primeau Hill" },
  { id: "act-201", entityType: "ORDER", entityId: "ord-21", message: "Order created in system", timestamp: "2026-08-05", user: "Josh Hoffman" },
  { id: "act-202", entityType: "OPPORTUNITY", entityId: "opp-100", message: "Sent proposal and pricing", timestamp: "2026-08-06", user: "Shayla Hilliard" },
  { id: "act-203", entityType: "ORGANIZATION", entityId: "org-40", message: "Left brochure with front office", timestamp: "2026-08-07", user: "Jason Mulder" },
  { id: "act-204", entityType: "ORDER", entityId: "ord-24", message: "Sent to vendor for production", timestamp: "2026-08-08", user: "David Lundberg" },
  { id: "act-205", entityType: "OPPORTUNITY", entityId: "opp-1", message: "Demo completed with AD", timestamp: "2026-08-09", user: "Primeau Hill" },
  { id: "act-206", entityType: "ORGANIZATION", entityId: "org-56", message: "Updated contact information", timestamp: "2026-08-10", user: "Josh Hoffman" },
  { id: "act-207", entityType: "ORDER", entityId: "ord-27", message: "Shipped to customer", timestamp: "2026-08-11", user: "Shayla Hilliard" },
  { id: "act-208", entityType: "OPPORTUNITY", entityId: "opp-4", message: "Payment received", timestamp: "2026-08-12", user: "Jason Mulder" },
  { id: "act-209", entityType: "ORGANIZATION", entityId: "org-61", message: "Annual check-in call", timestamp: "2026-08-13", user: "David Lundberg" },
  { id: "act-210", entityType: "ORDER", entityId: "ord-30", message: "Customer satisfaction follow-up", timestamp: "2026-08-14", user: "Primeau Hill" },
  { id: "act-211", entityType: "OPPORTUNITY", entityId: "opp-7", message: "Initial contact made", timestamp: "2026-08-15", user: "Josh Hoffman" },
  { id: "act-212", entityType: "ORGANIZATION", entityId: "org-10", message: "Email sent introducing TUF Ops", timestamp: "2026-08-16", user: "Shayla Hilliard" },
  { id: "act-213", entityType: "ORDER", entityId: "ord-33", message: "Artwork files received", timestamp: "2026-08-17", user: "Jason Mulder" },
  { id: "act-214", entityType: "OPPORTUNITY", entityId: "opp-10", message: "Presented to athletic director", timestamp: "2026-08-18", user: "David Lundberg" },
  { id: "act-215", entityType: "ORGANIZATION", entityId: "org-38", message: "Account review completed", timestamp: "2026-08-19", user: "Primeau Hill" },
  { id: "act-216", entityType: "ORDER", entityId: "ord-36", message: "Quality check passed", timestamp: "2026-08-20", user: "Josh Hoffman" },
  { id: "act-217", entityType: "OPPORTUNITY", entityId: "opp-13", message: "Sent contract for signature", timestamp: "2026-08-21", user: "Shayla Hilliard" },
  { id: "act-218", entityType: "ORGANIZATION", entityId: "org-80", message: "Sent marketing materials", timestamp: "2026-08-22", user: "Jason Mulder" },
  { id: "act-219", entityType: "ORDER", entityId: "ord-39", message: "Order completed and archived", timestamp: "2026-08-23", user: "David Lundberg" },
  { id: "act-220", entityType: "OPPORTUNITY", entityId: "opp-16", message: "Discussed timeline and budget", timestamp: "2026-08-24", user: "Primeau Hill" },
];

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

// Re-export vendor data for mock mode
export { tufVendors } from './vendors';
export type { Vendor, VendorAgreement, VendorPerformance, VendorPayment } from '../services/vendorsService';
