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
