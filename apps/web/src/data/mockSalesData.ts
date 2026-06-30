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
  { id: 'u-owner-coach-bradshaw', name: 'A Bradshaw', role: 'OWNER', territoryIds: ['metro', 'north', 'west', 'south'], active: true },
  { id: 'u-director-primeau-hill', name: 'Primeau Hill', role: 'DIRECTOR', territoryIds: ['metro', 'north', 'west', 'south'], active: true },
  { id: 'u-rep-josh-hoffman', name: 'Josh Hoffman', role: 'REP', territoryIds: ['metro'], active: true },
  { id: 'u-rep-shayla-hilliard', name: 'Shayla Hilliard', role: 'REP', territoryIds: ['north'], active: true },
  { id: 'u-rep-jason-mulder', name: 'Jason Mulder', role: 'REP', territoryIds: ['south'], active: true },
  { id: 'u-rep-david-lundberg', name: 'David Lundberg', role: 'REP', territoryIds: ['north', 'west'], active: true },
];

// Mock operational records were removed except for one controlled baseline account used by internal rollout smoke tests.
export const organizations: Organization[] = [
  {
    id: 'org-metro-001', name: 'Edina High School', city: 'Edina', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '952-848-3800', athleticDirectorName: 'Troy Stein', athleticDirectorEmail: 'troy.stein@edinaschools.org', athleticDirectorPhone: '952-848-3801',
    headCoachName: 'Jason Potts', headCoachEmail: 'jason.potts@edinaschools.org', headCoachPhone: '952-848-3802',
    coverageStatus: 'ACTIVE', priority: 'HIGH', pipelineValue: 21500, status: 'ACTIVE', nextAction: 'Deliver football uniform mockup', lastActivity: '2026-08-25', leadTier: 'TIER_1',
    laneStatuses: {
      UNIFORM: { status: 'ACTIVE', estimatedValue: 14500, activeOpportunityCount: 1, nextAction: 'Deliver mockup' },
      TRAVEL_GEAR: { status: 'WON', estimatedValue: 4200, activeOpportunityCount: 0, nextAction: 'Up-sell team store' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Introduce team store concept' },
      LETTERMAN: { status: 'WON', estimatedValue: 2800, activeOpportunityCount: 0, nextAction: 'Send reorder link' },
    }, expansionRecommendation: 'Great travel gear adoption. Pitch full uniform rebrand for 2026-27.',
  },
  {
    id: 'org-metro-002', name: 'Wayzata High School', city: 'Plymouth', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '763-745-6600', athleticDirectorName: 'Jaime Sherwood', athleticDirectorEmail: 'jaime.sherwood@wayzataschools.org', athleticDirectorPhone: '763-745-6601',
    headCoachName: 'Lambert Brown', headCoachEmail: 'lambert.brown@wayzataschools.org', headCoachPhone: '763-745-6602',
    coverageStatus: 'ACTIVE', priority: 'HIGH', pipelineValue: 18700, status: 'ACTIVE', nextAction: 'Follow up on invoice for basketball travel gear', lastActivity: '2026-08-24', leadTier: 'TIER_1',
    laneStatuses: {
      UNIFORM: { status: 'WON', estimatedValue: 11200, activeOpportunityCount: 0, nextAction: 'Check production status' },
      TRAVEL_GEAR: { status: 'ACTIVE', estimatedValue: 5500, activeOpportunityCount: 1, nextAction: 'Send invoice' },
      TEAM_STORE: { status: 'WON', estimatedValue: 2000, activeOpportunityCount: 0, nextAction: 'Review store analytics' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Contact booster club' },
    }, expansionRecommendation: 'Strong uniform partner. Expand into letterman jackets with booster club.',
  },
  {
    id: 'org-metro-003', name: 'Minnetonka High School', city: 'Minnetonka', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '952-401-5800', athleticDirectorName: 'Ted Schultz', athleticDirectorEmail: 'ted.schultz@minnetonkaschools.org', athleticDirectorPhone: '952-401-5801',
    headCoachName: 'Mark Esch', headCoachEmail: 'mark.esch@minnetonkaschools.org', headCoachPhone: '952-401-5802',
    coverageStatus: 'ACTIVE', priority: 'MEDIUM', pipelineValue: 12300, status: 'ACTIVE', nextAction: 'Schedule discovery call for soccer uniforms', lastActivity: '2026-08-22', leadTier: 'TIER_1',
    laneStatuses: {
      UNIFORM: { status: 'WON', estimatedValue: 8900, activeOpportunityCount: 0, nextAction: 'Production check' },
      TRAVEL_GEAR: { status: 'WON', estimatedValue: 3400, activeOpportunityCount: 0, nextAction: 'None' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Intro call' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'Solid uniform and travel gear. Introduce team store for spirit wear.',
  },
  {
    id: 'org-metro-004', name: 'Eden Prairie High School', city: 'Eden Prairie', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '952-975-8000', athleticDirectorName: 'Russ Reetz', athleticDirectorEmail: 'russ.reetz@edenpr.org', athleticDirectorPhone: '952-975-8001',
    headCoachName: 'Mike Grant', headCoachEmail: 'mike.grant@edenpr.org', headCoachPhone: '952-975-8002',
    coverageStatus: 'ACTIVE', priority: 'HIGH', pipelineValue: 16200, status: 'ACTIVE', nextAction: 'Send football uniform invoice', lastActivity: '2026-08-25', leadTier: 'TIER_1',
    laneStatuses: {
      UNIFORM: { status: 'ACTIVE', estimatedValue: 13300, activeOpportunityCount: 1, nextAction: 'Invoice sent — awaiting payment' },
      TRAVEL_GEAR: { status: 'WON', estimatedValue: 2900, activeOpportunityCount: 0, nextAction: 'None' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Pitch fall spirit wear' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'Elite football program. Long-term uniform cycle partner. Push team store.',
  },
  {
    id: 'org-metro-005', name: 'Bloomington Jefferson High School', city: 'Bloomington', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '952-806-7600', athleticDirectorName: 'Mike Palmquist', athleticDirectorEmail: 'mpalmquist@isd271.org', athleticDirectorPhone: '952-806-7601',
    headCoachName: 'Tim Carlson', headCoachEmail: 'tcarlson@isd271.org', headCoachPhone: '952-806-7602',
    coverageStatus: 'ACTIVE', priority: 'MEDIUM', pipelineValue: 9500, status: 'ACTIVE', nextAction: 'Mockup review for volleyball uniforms', lastActivity: '2026-08-23', leadTier: 'TIER_2',
    laneStatuses: {
      UNIFORM: { status: 'ACTIVE', estimatedValue: 7200, activeOpportunityCount: 1, nextAction: 'Mockup revision requested' },
      TRAVEL_GEAR: { status: 'WON', estimatedValue: 2300, activeOpportunityCount: 0, nextAction: 'None' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'Growing account. Land volleyball then cross-sell basketball.',
  },
  {
    id: 'org-metro-006', name: 'Bloomington Kennedy High School', city: 'Bloomington', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '952-806-7300', athleticDirectorName: 'Dave Sarenpa', athleticDirectorEmail: 'dsarenpa@isd271.org', athleticDirectorPhone: '952-806-7301',
    headCoachName: 'Josh Holfeld', headCoachEmail: 'jholfeld@isd271.org', headCoachPhone: '952-806-7302',
    coverageStatus: 'CONTACTED', priority: 'MEDIUM', pipelineValue: 3200, status: 'WATCH', nextAction: 'Follow up on basketball travel gear quote', lastActivity: '2026-08-18', leadTier: 'TIER_2',
    laneStatuses: {
      UNIFORM: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Reconnect with AD' },
      TRAVEL_GEAR: { status: 'ACTIVE', estimatedValue: 3200, activeOpportunityCount: 1, nextAction: 'Follow up on quote' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'Re-engage AD. Jefferson is stronger account — leverage relationship.',
  },
  {
    id: 'org-metro-007', name: 'Richfield High School', city: 'Richfield', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '612-798-6100', athleticDirectorName: 'Tom Ihnot', athleticDirectorEmail: 'tom.ihnot@rpsmn.org', athleticDirectorPhone: '612-798-6101',
    headCoachName: 'Kris Pulford', headCoachEmail: 'kris.pulford@rpsmn.org', headCoachPhone: '612-798-6102',
    coverageStatus: 'ACTIVE', priority: 'MEDIUM', pipelineValue: 8700, status: 'ACTIVE', nextAction: 'Discovery call for soccer + baseball', lastActivity: '2026-08-24', leadTier: 'TIER_2',
    laneStatuses: {
      UNIFORM: { status: 'WON', estimatedValue: 5600, activeOpportunityCount: 0, nextAction: 'Production tracking' },
      TRAVEL_GEAR: { status: 'ACTIVE', estimatedValue: 3100, activeOpportunityCount: 1, nextAction: 'Discovery call' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'Solid mid-tier. Land travel gear, then push for spring sports.',
  },
  {
    id: 'org-metro-008', name: 'Mounds View High School', city: 'Arden Hills', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '651-621-7100', athleticDirectorName: 'Bob Madison', athleticDirectorEmail: 'bob.madison@moundsviewschools.org', athleticDirectorPhone: '651-621-7101',
    headCoachName: 'Aaron Moberg', headCoachEmail: 'aaron.moberg@moundsviewschools.org', headCoachPhone: '651-621-7102',
    coverageStatus: 'ACTIVE', priority: 'HIGH', pipelineValue: 13800, status: 'ACTIVE', nextAction: 'Finalize mockup approval', lastActivity: '2026-08-25', leadTier: 'TIER_2',
    laneStatuses: {
      UNIFORM: { status: 'ACTIVE', estimatedValue: 9800, activeOpportunityCount: 1, nextAction: 'Awaiting mockup approval' },
      TRAVEL_GEAR: { status: 'WON', estimatedValue: 4000, activeOpportunityCount: 0, nextAction: 'None' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Pitch after uniform close' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'Strong potential. Uniform deal close imminent. Follow with team store.',
  },
  {
    id: 'org-metro-009', name: 'Roseville Area High School', city: 'Roseville', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '651-635-1620', athleticDirectorName: 'Jeff Whisler', athleticDirectorEmail: 'jeff.whisler@isd623.org', athleticDirectorPhone: '651-635-1621',
    headCoachName: 'Chris Simonson', headCoachEmail: 'chris.simonson@isd623.org', headCoachPhone: '651-635-1622',
    coverageStatus: 'CONTACTED', priority: 'LOW', pipelineValue: 0, status: 'WATCH', nextAction: 'Reconnect after fall season starts', lastActivity: '2026-08-10', leadTier: 'TIER_2',
    laneStatuses: {
      UNIFORM: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Reconnect' },
      TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'Low engagement. Needs consistent touchpoints before pitch.',
  },
  {
    id: 'org-metro-010', name: 'Irondale High School', city: 'New Brighton', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '651-621-6800', athleticDirectorName: 'Tom Fritze', athleticDirectorEmail: 'tom.fritze@moundsviewschools.org', athleticDirectorPhone: '651-621-6801',
    headCoachName: 'Ben Mauer', headCoachEmail: 'ben.mauer@moundsviewschools.org', headCoachPhone: '651-621-6802',
    coverageStatus: 'ACTIVE', priority: 'MEDIUM', pipelineValue: 6400, status: 'ACTIVE', nextAction: 'Send updated basketball uniform quote', lastActivity: '2026-08-22', leadTier: 'TIER_2',
    laneStatuses: {
      UNIFORM: { status: 'ACTIVE', estimatedValue: 6400, activeOpportunityCount: 1, nextAction: 'Quote revision' },
      TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'Basketball focused. Win this then introduce travel gear.',
  },
  {
    id: 'org-metro-011', name: 'White Bear Lake High School', city: 'White Bear Lake', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '651-773-6200', athleticDirectorName: 'Mike Bahl', athleticDirectorEmail: 'mike.bahl@isd624.org', athleticDirectorPhone: '651-773-6201',
    headCoachName: 'Ryan Bartlett', headCoachEmail: 'ryan.bartlett@isd624.org', headCoachPhone: '651-773-6202',
    coverageStatus: 'CONTACTED', priority: 'MEDIUM', pipelineValue: 2500, status: 'WATCH', nextAction: 'Discovery call scheduled Sept 2', lastActivity: '2026-08-19', leadTier: 'TIER_2',
    laneStatuses: {
      UNIFORM: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Discovery call' },
      TRAVEL_GEAR: { status: 'ACTIVE', estimatedValue: 2500, activeOpportunityCount: 1, nextAction: 'Discovery call Sept 2' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'Entry via travel gear. Warm intro from neighboring district.',
  },
  {
    id: 'org-metro-012', name: 'Stillwater Area High School', city: 'Stillwater', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '651-351-8040', athleticDirectorName: 'Ricky Michel', athleticDirectorEmail: 'michelr@stillwaterschools.org', athleticDirectorPhone: '651-351-8041',
    headCoachName: 'Beau LaBore', headCoachEmail: 'laboreb@stillwaterschools.org', headCoachPhone: '651-351-8042',
    coverageStatus: 'ACTIVE', priority: 'HIGH', pipelineValue: 15800, status: 'ACTIVE', nextAction: 'Invoice sent — follow up', lastActivity: '2026-08-24', leadTier: 'TIER_1',
    laneStatuses: {
      UNIFORM: { status: 'ACTIVE', estimatedValue: 12400, activeOpportunityCount: 1, nextAction: 'Invoice payment pending' },
      TRAVEL_GEAR: { status: 'WON', estimatedValue: 3400, activeOpportunityCount: 0, nextAction: 'None' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Pitch after uniform close' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'High-value account. Close football uniforms, expand to team store.',
  },
  {
    id: 'org-metro-013', name: 'Woodbury High School', city: 'Woodbury', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '651-768-4400', athleticDirectorName: 'Jason Gonnion', athleticDirectorEmail: 'jgonnion@sowashco.org', athleticDirectorPhone: '651-768-4401',
    headCoachName: 'Andy Hill', headCoachEmail: 'ahill1@sowashco.org', headCoachPhone: '651-768-4402',
    coverageStatus: 'CONTACTED', priority: 'LOW', pipelineValue: 0, status: 'NEW', nextAction: 'Initial outreach phone call', lastActivity: '2026-08-15', leadTier: 'TIER_2',
    laneStatuses: {
      UNIFORM: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Initial outreach' },
      TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'New to pipeline. Needs relationship building.',
  },
  {
    id: 'org-metro-014', name: 'East Ridge High School', city: 'Woodbury', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '651-768-2300', athleticDirectorName: 'Matt Percival', athleticDirectorEmail: 'mpercival@sowashco.org', athleticDirectorPhone: '651-768-2301',
    headCoachName: 'Dan Fritze', headCoachEmail: 'dfritze@sowashco.org', headCoachPhone: '651-768-2302',
    coverageStatus: 'CONTACTED', priority: 'MEDIUM', pipelineValue: 4700, status: 'WATCH', nextAction: 'Send volleyball travel gear quote', lastActivity: '2026-08-21', leadTier: 'TIER_2',
    laneStatuses: {
      UNIFORM: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      TRAVEL_GEAR: { status: 'ACTIVE', estimatedValue: 4700, activeOpportunityCount: 1, nextAction: 'Quote pending' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'Travel gear entry point. Good volleyball program.',
  },
  {
    id: 'org-metro-015', name: 'Park High School', city: 'Cottage Grove', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '651-768-3700', athleticDirectorName: 'Phil Kuemmel', athleticDirectorEmail: 'pkuemmel@sowashco.org', athleticDirectorPhone: '651-768-3701',
    headCoachName: 'Rick Fryklund', headCoachEmail: 'rfryklund@sowashco.org', headCoachPhone: '651-768-3702',
    coverageStatus: 'UNTOUCHED', priority: 'LOW', pipelineValue: 0, status: 'NEW', nextAction: 'Research athletic program needs', lastActivity: '2026-06-30', leadTier: 'TIER_3',
    laneStatuses: {
      UNIFORM: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Research needs' },
      TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'Untouched. Lower priority — focus on Tier 1-2 first.',
  },
  {
    id: 'org-metro-016', name: 'Southwest High School', city: 'Minneapolis', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '612-668-3030', athleticDirectorName: 'Ryan Lamberty', athleticDirectorEmail: 'ryan.lamberty@mpls.k12.mn.us', athleticDirectorPhone: '612-668-3031',
    headCoachName: 'Josh Miron', headCoachEmail: 'josh.miron@mpls.k12.mn.us', headCoachPhone: '612-668-3032',
    coverageStatus: 'CONTACTED', priority: 'MEDIUM', pipelineValue: 3800, status: 'WATCH', nextAction: 'Send soccer uniform samples', lastActivity: '2026-08-16', leadTier: 'TIER_2',
    laneStatuses: {
      UNIFORM: { status: 'ACTIVE', estimatedValue: 3800, activeOpportunityCount: 1, nextAction: 'Sample delivery' },
      TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'Soccer-focused. Use sample quality to win trust.',
  },
  {
    id: 'org-metro-017', name: 'Washburn High School', city: 'Minneapolis', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '612-668-3400', athleticDirectorName: 'Reggie Perkins', athleticDirectorEmail: 'reggie.perkins@mpls.k12.mn.us', athleticDirectorPhone: '612-668-3401',
    headCoachName: 'Mitch Johnson', headCoachEmail: 'mitch.johnson@mpls.k12.mn.us', headCoachPhone: '612-668-3402',
    coverageStatus: 'ACTIVE', priority: 'MEDIUM', pipelineValue: 7600, status: 'ACTIVE', nextAction: 'Mockup review — basketball uniforms', lastActivity: '2026-08-24', leadTier: 'TIER_2',
    laneStatuses: {
      UNIFORM: { status: 'ACTIVE', estimatedValue: 6100, activeOpportunityCount: 1, nextAction: 'Mockup review meeting' },
      TRAVEL_GEAR: { status: 'WON', estimatedValue: 1500, activeOpportunityCount: 0, nextAction: 'None' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'Basketball-focused. Good travel gear traction.',
  },
  {
    id: 'org-metro-018', name: 'South High School', city: 'Minneapolis', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '612-668-4300', athleticDirectorName: 'Leo White', athleticDirectorEmail: 'leo.white@mpls.k12.mn.us', athleticDirectorPhone: '612-668-4301',
    headCoachName: 'Antonio Levine', headCoachEmail: 'antonio.levine@mpls.k12.mn.us', headCoachPhone: '612-668-4302',
    coverageStatus: 'UNTOUCHED', priority: 'LOW', pipelineValue: 0, status: 'NEW', nextAction: 'Introductory email', lastActivity: '2026-06-30', leadTier: 'TIER_3',
    laneStatuses: {
      UNIFORM: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Intro email' },
      TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'Untouched urban school. Needs dedicated outreach.',
  },
  {
    id: 'org-metro-019', name: 'Roosevelt High School', city: 'Minneapolis', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '612-668-4800', athleticDirectorName: 'Dennis Adams', athleticDirectorEmail: 'dennis.adams@mpls.k12.mn.us', athleticDirectorPhone: '612-668-4801',
    headCoachName: 'Tyrone Taylor', headCoachEmail: 'tyrone.taylor@mpls.k12.mn.us', headCoachPhone: '612-668-4802',
    coverageStatus: 'UNTOUCHED', priority: 'LOW', pipelineValue: 0, status: 'NEW', nextAction: 'Research AD contact', lastActivity: '2026-06-30', leadTier: 'TIER_3',
    laneStatuses: {
      UNIFORM: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Research' },
      TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'Untouched. Bundle with South High outreach.',
  },
  {
    id: 'org-metro-020', name: 'Highland Park High School', city: 'St. Paul', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '651-744-3800', athleticDirectorName: 'Mark Porter', athleticDirectorEmail: 'mark.porter@spps.org', athleticDirectorPhone: '651-744-3801',
    headCoachName: 'Willie Braziel', headCoachEmail: 'willie.braziel@spps.org', headCoachPhone: '651-744-3802',
    coverageStatus: 'CONTACTED', priority: 'MEDIUM', pipelineValue: 5100, status: 'WATCH', nextAction: 'Follow up on lead', lastActivity: '2026-08-12', leadTier: 'TIER_2',
    laneStatuses: {
      UNIFORM: { status: 'ACTIVE', estimatedValue: 5100, activeOpportunityCount: 1, nextAction: 'Discovery follow-up' },
      TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'Lead engaged. Needs nurturing to active pipeline.',
  },
  {
    id: 'org-metro-021', name: 'Central High School', city: 'St. Paul', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '651-744-4900', athleticDirectorName: 'Tim Zupon', athleticDirectorEmail: 'tim.zupon@spps.org', athleticDirectorPhone: '651-744-4901',
    headCoachName: 'Scott Howell', headCoachEmail: 'scott.howell@spps.org', headCoachPhone: '651-744-4902',
    coverageStatus: 'ACTIVE', priority: 'HIGH', pipelineValue: 11200, status: 'ACTIVE', nextAction: 'Invoice sent — awaiting payment', lastActivity: '2026-08-25', leadTier: 'TIER_2',
    laneStatuses: {
      UNIFORM: { status: 'ACTIVE', estimatedValue: 8500, activeOpportunityCount: 1, nextAction: 'Payment pending' },
      TRAVEL_GEAR: { status: 'WON', estimatedValue: 2700, activeOpportunityCount: 0, nextAction: 'None' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'Strong St. Paul presence. Expand to letterman.',
  },
  {
    id: 'org-metro-022', name: 'Como Park High School', city: 'St. Paul', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '651-744-2000', athleticDirectorName: 'Mike Searles', athleticDirectorEmail: 'mike.searles@spps.org', athleticDirectorPhone: '651-744-2001',
    headCoachName: 'James Robinson', headCoachEmail: 'james.robinson@spps.org', headCoachPhone: '651-744-2002',
    coverageStatus: 'UNTOUCHED', priority: 'LOW', pipelineValue: 0, status: 'NEW', nextAction: 'Introductory call', lastActivity: '2026-06-30', leadTier: 'TIER_3',
    laneStatuses: {
      UNIFORM: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Intro call' },
      TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'Untouched. Leverage Central relationship for intro.',
  },
  {
    id: 'org-metro-023', name: 'Johnson High School', city: 'St. Paul', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '651-744-3600', athleticDirectorName: 'Eric Harris', athleticDirectorEmail: 'eric.harris@spps.org', athleticDirectorPhone: '651-744-3601',
    headCoachName: 'Brian Jones', headCoachEmail: 'brian.jones@spps.org', headCoachPhone: '651-744-3602',
    coverageStatus: 'CONTACTED', priority: 'LOW', pipelineValue: 0, status: 'NEW', nextAction: 'Send intro packet', lastActivity: '2026-08-08', leadTier: 'TIER_3',
    laneStatuses: {
      UNIFORM: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Intro packet' },
      TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'Early stage. Needs consistent follow-up.',
  },
  {
    id: 'org-metro-024', name: 'Harding High School', city: 'St. Paul', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '651-744-3100', athleticDirectorName: 'Dan Hendrickson', athleticDirectorEmail: 'dan.hendrickson@spps.org', athleticDirectorPhone: '651-744-3101',
    headCoachName: 'Tony Smith', headCoachEmail: 'tony.smith@spps.org', headCoachPhone: '651-744-3102',
    coverageStatus: 'UNTOUCHED', priority: 'LOW', pipelineValue: 0, status: 'NEW', nextAction: 'Research program needs', lastActivity: '2026-06-30', leadTier: 'TIER_3',
    laneStatuses: {
      UNIFORM: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Research' },
      TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'Untouched. Low priority for now.',
  },
  {
    id: 'org-metro-025', name: 'Fridley High School', city: 'Fridley', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro',
    schoolPhone: '763-502-5600', athleticDirectorName: 'John Moberg', athleticDirectorEmail: 'john.moberg@fridley.k12.mn.us', athleticDirectorPhone: '763-502-5601',
    headCoachName: 'Justin Reese', headCoachEmail: 'justin.reese@fridley.k12.mn.us', headCoachPhone: '763-502-5602',
    coverageStatus: 'CONTACTED', priority: 'MEDIUM', pipelineValue: 2100, status: 'WATCH', nextAction: 'Call about track uniforms', lastActivity: '2026-08-17', leadTier: 'TIER_2',
    laneStatuses: {
      UNIFORM: { status: 'ACTIVE', estimatedValue: 2100, activeOpportunityCount: 1, nextAction: 'Quote preparation' },
      TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' },
    }, expansionRecommendation: 'Niche sport entry. Track could open doors to football.',
 },
 { id: 'org-metro-026', name: 'Columbia Heights High School', city: 'Columbia Heights', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro', schoolPhone: '763-706-3830', athleticDirectorName: 'Matt Miller', athleticDirectorEmail: 'matt.miller@colheights.k12.mn.us', athleticDirectorPhone: '763-706-3831', headCoachName: 'Troy Fuller', headCoachEmail: 'troy.fuller@colheights.k12.mn.us', headCoachPhone: '763-706-3832', coverageStatus: 'UNTOUCHED', priority: 'LOW', pipelineValue: 0, status: 'NEW', nextAction: 'Introductory cold email', lastActivity: '2026-06-30', leadTier: 'TIER_3', laneStatuses: { UNIFORM: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Cold email' }, TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' }, TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' }, LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' } }, expansionRecommendation: 'Untouched. Bundle with Fridley territory day.' },
 { id: 'org-metro-027', name: 'Henry High School', city: 'Minneapolis', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro', schoolPhone: '612-668-3500', athleticDirectorName: 'Tony Patterson', athleticDirectorEmail: 'tony.patterson@mpls.k12.mn.us', athleticDirectorPhone: '612-668-3501', headCoachName: 'DeAndre Jackson', headCoachEmail: 'deandre.jackson@mpls.k12.mn.us', headCoachPhone: '612-668-3502', coverageStatus: 'CONTACTED', priority: 'LOW', pipelineValue: 0, status: 'NEW', nextAction: 'Follow up voicemail', lastActivity: '2026-08-14', leadTier: 'TIER_3', laneStatuses: { UNIFORM: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Follow up' }, TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' }, TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' }, LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' } }, expansionRecommendation: 'Contacted but low engagement. Try warm intro via Washburn AD.' },
 { id: 'org-metro-028', name: 'Edison High School', city: 'Minneapolis', state: 'MN', assignedRep: 'Josh Hoffman', assignedDirector: 'Primeau Hill', territory: 'metro', schoolPhone: '612-668-2900', athleticDirectorName: 'Carlos Mendez', athleticDirectorEmail: 'carlos.mendez@mpls.k12.mn.us', athleticDirectorPhone: '612-668-2901', headCoachName: 'Samir Hassan', headCoachEmail: 'samir.hassan@mpls.k12.mn.us', headCoachPhone: '612-668-2902', coverageStatus: 'UNTOUCHED', priority: 'LOW', pipelineValue: 0, status: 'NEW', nextAction: 'Research soccer program', lastActivity: '2026-06-30', leadTier: 'TIER_3', laneStatuses: { UNIFORM: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Research' }, TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' }, TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' }, LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' } }, expansionRecommendation: 'Strong soccer tradition. Worth pursuing despite low tier.' },
 { id: 'org-north-001', name: 'Maple Grove Senior High', city: 'Maple Grove', state: 'MN', assignedRep: 'Shayla Hilliard', assignedDirector: 'Primeau Hill', territory: 'north', schoolPhone: '763-391-8300', athleticDirectorName: 'Brent Pedersen', athleticDirectorEmail: 'pedersenb@district279.org', athleticDirectorPhone: '763-391-8301', headCoachName: 'Lonnie Mork', headCoachEmail: 'morkl@district279.org', headCoachPhone: '763-391-8302', coverageStatus: 'ACTIVE', priority: 'HIGH', pipelineValue: 13200, status: 'ACTIVE', nextAction: 'Send invoice for football uniforms', lastActivity: '2026-08-25', leadTier: 'TIER_1', laneStatuses: { UNIFORM: { status: 'ACTIVE', estimatedValue: 10500, activeOpportunityCount: 1, nextAction: 'Invoice sent' }, TRAVEL_GEAR: { status: 'WON', estimatedValue: 2700, activeOpportunityCount: 0, nextAction: 'Production check' }, TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Pitch spring sports store' }, LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' } }, expansionRecommendation: 'Large school. Strong uniform potential. Expand to full program.' },
 { id: 'org-north-002', name: 'Osseo Senior High', city: 'Osseo', state: 'MN', assignedRep: 'Shayla Hilliard', assignedDirector: 'Primeau Hill', territory: 'north', schoolPhone: '763-391-8500', athleticDirectorName: 'Dan Holter', athleticDirectorEmail: 'holterd@district279.org', athleticDirectorPhone: '763-391-8501', headCoachName: 'Ryan Stockhaus', headCoachEmail: 'stockhausr@district279.org', headCoachPhone: '763-391-8502', coverageStatus: 'ACTIVE', priority: 'MEDIUM', pipelineValue: 9700, status: 'ACTIVE', nextAction: 'Mockup delivery for basketball uniforms', lastActivity: '2026-08-23', leadTier: 'TIER_2', laneStatuses: { UNIFORM: { status: 'ACTIVE', estimatedValue: 7800, activeOpportunityCount: 1, nextAction: 'Mockup under review' }, TRAVEL_GEAR: { status: 'WON', estimatedValue: 1900, activeOpportunityCount: 0, nextAction: 'None' }, TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' }, LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' } }, expansionRecommendation: 'Basketball focus. Cross-sell to other winter sports.' },
 { id: 'org-north-003', name: 'Champlin Park High School', city: 'Champlin', state: 'MN', assignedRep: 'Shayla Hilliard', assignedDirector: 'Primeau Hill', territory: 'north', schoolPhone: '763-506-3500', athleticDirectorName: 'Matt Miller', athleticDirectorEmail: 'matt.miller@ahschools.us', athleticDirectorPhone: '763-506-3501', headCoachName: 'Nick Keenan', headCoachEmail: 'nick.keenan@ahschools.us', headCoachPhone: '763-506-3502', coverageStatus: 'ACTIVE', priority: 'MEDIUM', pipelineValue: 8400, status: 'ACTIVE', nextAction: 'Discovery call for volleyball uniforms', lastActivity: '2026-08-24', leadTier: 'TIER_2', laneStatuses: { UNIFORM: { status: 'ACTIVE', estimatedValue: 6300, activeOpportunityCount: 1, nextAction: 'Discovery scheduled' }, TRAVEL_GEAR: { status: 'WON', estimatedValue: 2100, activeOpportunityCount: 0, nextAction: 'None' }, TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' }, LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' } }, expansionRecommendation: 'Good VB program. Land uniforms then push team store.' },
 { id: 'org-north-004', name: 'Anoka High School', city: 'Anoka', state: 'MN', assignedRep: 'Shayla Hilliard', assignedDirector: 'Primeau Hill', territory: 'north', schoolPhone: '763-506-6200', athleticDirectorName: 'Todd Springer', athleticDirectorEmail: 'todd.springer@ahschools.us', athleticDirectorPhone: '763-506-6201', headCoachName: 'Bo Wasurick', headCoachEmail: 'bo.wasurick@ahschools.us', headCoachPhone: '763-506-6202', coverageStatus: 'CONTACTED', priority: 'MEDIUM', pipelineValue: 4500, status: 'WATCH', nextAction: 'Send football travel gear quote', lastActivity: '2026-08-20', leadTier: 'TIER_2', laneStatuses: { UNIFORM: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' }, TRAVEL_GEAR: { status: 'ACTIVE', estimatedValue: 4500, activeOpportunityCount: 1, nextAction: 'Quote pending' }, TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' }, LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' } }, expansionRecommendation: 'Historic program. Travel gear entry could unlock uniforms.' },
 { id: 'org-north-005', name: 'Coon Rapids High School', city: 'Coon Rapids', state: 'MN', assignedRep: 'Shayla Hilliard', assignedDirector: 'Primeau Hill', territory: 'north', schoolPhone: '763-506-6100', athleticDirectorName: 'Jeff Sorensen', athleticDirectorEmail: 'jeff.sorensen@ahschools.us', athleticDirectorPhone: '763-506-6101', headCoachName: 'Nick Rusin', headCoachEmail: 'nick.rusin@ahschools.us', headCoachPhone: '763-506-6102', coverageStatus: 'CONTACTED', priority: 'LOW', pipelineValue: 0, status: 'NEW', nextAction: 'Reconnect with AD', lastActivity: '2026-08-11', leadTier: 'TIER_2', laneStatuses: { UNIFORM: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Reconnect' }, TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' }, TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' }, LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' } }, expansionRecommendation: 'Low engagement. Group with Anoka visit.' },
 { id: 'org-north-006', name: 'Blaine High School', city: 'Blaine', state: 'MN', assignedRep: 'Shayla Hilliard', assignedDirector: 'Primeau Hill', territory: 'north', schoolPhone: '763-506-5800', athleticDirectorName: 'Shannon Gerrety', athleticDirectorEmail: 'shannon.gerrety@ahschools.us', athleticDirectorPhone: '763-506-5801', headCoachName: 'Tom Develice', headCoachEmail: 'tom.develice@ahschools.us', headCoachPhone: '763-506-5802', coverageStatus: 'ACTIVE', priority: 'HIGH', pipelineValue: 11800, status: 'ACTIVE', nextAction: 'Awaiting mockup approval', lastActivity: '2026-08-24', leadTier: 'TIER_1', laneStatuses: { UNIFORM: { status: 'ACTIVE', estimatedValue: 9200, activeOpportunityCount: 1, nextAction: 'Mockup review' }, TRAVEL_GEAR: { status: 'WON', estimatedValue: 2600, activeOpportunityCount: 0, nextAction: 'None' }, TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Pitch after close' }, LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' } }, expansionRecommendation: 'Large suburban school. High ceiling across all lanes.' },
 { id: 'org-north-007', name: 'Andover High School', city: 'Andover', state: 'MN', assignedRep: 'Shayla Hilliard', assignedDirector: 'Primeau Hill', territory: 'north', schoolPhone: '763-506-6000', athleticDirectorName: 'John Dehn', athleticDirectorEmail: 'john.dehn@ahschools.us', athleticDirectorPhone: '763-506-6001', headCoachName: 'Rich Wilkie', headCoachEmail: 'rich.wilkie@ahschools.us', headCoachPhone: '763-506-6002', coverageStatus: 'ACTIVE', priority: 'MEDIUM', pipelineValue: 7300, status: 'ACTIVE', nextAction: 'Discovery call for soccer uniforms', lastActivity: '2026-08-23', leadTier: 'TIER_2', laneStatuses: { UNIFORM: { status: 'ACTIVE', estimatedValue: 5400, activeOpportunityCount: 1, nextAction: 'Discovery in progress' }, TRAVEL_GEAR: { status: 'WON', estimatedValue: 1900, activeOpportunityCount: 0, nextAction: 'None' }, TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' }, LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'None' } }, expansionRecommendation: 'Good soccer program. Land uniforms then expand.' },
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
