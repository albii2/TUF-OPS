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
  laneStatuses: Record<RevenueLane, {
    status: LaneStatus;
    estimatedValue: number;
    activeOpportunityCount: number;
    nextAction: string;
  }>;
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

export const teamMembers: TeamMember[] = [
  { id: 'u-owner', name: 'Coach Bradshaw', role: 'OWNER', territoryIds: ['metro', 'north', 'west', 'south'], active: true },
  { id: 'u-dir-dana', name: 'Dana Holt', role: 'DIRECTOR', territoryIds: ['metro', 'west'], active: true },
  { id: 'u-dir-chris', name: 'Chris Vale', role: 'DIRECTOR', territoryIds: ['north', 'south'], active: true },
  { id: 'u-rep-maya', name: 'Maya Cole', role: 'REP', territoryIds: ['metro', 'north'], active: true },
  { id: 'u-rep-evan', name: 'Evan Shaw', role: 'REP', territoryIds: ['west'], active: true },
  { id: 'u-rep-jules', name: 'Jules Park', role: 'REP', territoryIds: ['south'], active: true },
];

export const organizations: Organization[] = [
  { id: 'org-northview', name: 'Northview Academy', city: 'Austin', state: 'TX', assignedRep: 'Maya Cole', assignedDirector: 'Dana Holt', territory: 'metro', coverageStatus: 'ACTIVE', priority: 'HIGH', pipelineValue: 84200, status: 'ACTIVE', nextAction: 'Present team store rollout plan', lastActivity: '2026-04-27', expansionRecommendation: 'Open LETTERMAN lane after closing TRAVEL_GEAR refresh package.', laneStatuses: { UNIFORM: { status: 'ACTIVE', estimatedValue: 32000, activeOpportunityCount: 2, nextAction: 'Finalize roster sizing' }, TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 18000, activeOpportunityCount: 1, nextAction: 'Confirm bag SKU mix' }, TEAM_STORE: { status: 'WON', estimatedValue: 22000, activeOpportunityCount: 0, nextAction: 'Upsell seasonal drops' }, LETTERMAN: { status: 'OPEN', estimatedValue: 12200, activeOpportunityCount: 1, nextAction: 'Pitch senior package' } } },
  { id: 'org-cedar-hill', name: 'Cedar Hill High', city: 'Dallas', state: 'TX', assignedRep: 'Evan Shaw', assignedDirector: 'Dana Holt', territory: 'west', coverageStatus: 'CONTACTED', priority: 'MEDIUM', pipelineValue: 65100, status: 'WATCH', nextAction: 'Follow up on invoice approval', lastActivity: '2026-04-10', expansionRecommendation: 'Convert UNIFORM renewal first, then activate TEAM_STORE in summer season.', laneStatuses: { UNIFORM: { status: 'ACTIVE', estimatedValue: 28000, activeOpportunityCount: 1, nextAction: 'Secure PO signature' }, TRAVEL_GEAR: { status: 'LOST', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Revisit next quarter' }, TEAM_STORE: { status: 'OPEN', estimatedValue: 21100, activeOpportunityCount: 1, nextAction: 'Review margin plan' }, LETTERMAN: { status: 'OPEN', estimatedValue: 16000, activeOpportunityCount: 1, nextAction: 'Collect booster feedback' } } },
  { id: 'org-liberty-prep', name: 'Liberty Prep', city: 'Phoenix', state: 'AZ', assignedRep: 'Maya Cole', assignedDirector: 'Chris Vale', territory: 'north', coverageStatus: 'UNTOUCHED', priority: 'HIGH', pipelineValue: 47900, status: 'NEW', nextAction: 'Book discovery call with AD', lastActivity: '2026-03-30', expansionRecommendation: 'Fastest path is TRAVEL_GEAR starter bundle with cross-sell to UNIFORM.', laneStatuses: { UNIFORM: { status: 'OPEN', estimatedValue: 21000, activeOpportunityCount: 1, nextAction: 'Map roster counts' }, TRAVEL_GEAR: { status: 'ACTIVE', estimatedValue: 14200, activeOpportunityCount: 1, nextAction: 'Deliver mockup v2' }, TEAM_STORE: { status: 'OPEN', estimatedValue: 7900, activeOpportunityCount: 1, nextAction: 'Share launch checklist' }, LETTERMAN: { status: 'OPEN', estimatedValue: 4800, activeOpportunityCount: 0, nextAction: 'Validate demand' } } },
];

export const opportunities: Opportunity[] = [
  { id: 'opp-1001', title: 'Varsity Football FA26 — Uniform', organizationId: 'org-northview', organizationName: 'Northview Academy', lane: 'UNIFORM', sport: 'Football', season: 'FA26', stage: 'INVOICE_SENT', value: 32000, assignedRep: 'Maya Cole', nextAction: 'Follow up with procurement tomorrow', lastActivity: '2026-04-27', closeProbability: 85 },
  { id: 'opp-1002', title: 'JV Basketball WI26 — Team Store', organizationId: 'org-cedar-hill', organizationName: 'Cedar Hill High', lane: 'TEAM_STORE', sport: 'Basketball', season: 'WI26', stage: 'MOCKUP_DELIVERED', value: 21100, assignedRep: 'Evan Shaw', nextAction: 'Collect principal sign-off', lastActivity: '2026-04-26', closeProbability: 62 },
  { id: 'opp-1003', title: '12U Football FA26 — Travel Gear', organizationId: 'org-liberty-prep', organizationName: 'Liberty Prep', lane: 'TRAVEL_GEAR', sport: 'Football', season: 'FA26', stage: 'DISCOVERY', value: 14200, assignedRep: 'Maya Cole', nextAction: 'Request final logo files', lastActivity: '2026-04-05', closeProbability: 48 },
  { id: 'opp-1004', title: 'All Athletics FA26 — Letterman', organizationId: 'org-northview', organizationName: 'Northview Academy', lane: 'LETTERMAN', sport: 'All Athletics', season: 'FA26', stage: 'CONTACTED', value: 12200, assignedRep: 'Maya Cole', nextAction: 'Run expansion ROI walkthrough', lastActivity: '2026-04-24', closeProbability: 38 },
];

export const orders: Order[] = [
  { id: 'ord-7001', organizationId: 'org-northview', organizationName: 'Northview Academy', opportunityId: 'opp-1001', lane: 'UNIFORM', value: 28750, productionStatus: 'IN_PRODUCTION', missingInfo: ['Final player numbers'], vendor: 'Prime Athletics', createdDate: '2026-04-18', vendorNotes: 'Awaiting player number sheet before embroidery lock.' },
  { id: 'ord-7002', organizationId: 'org-cedar-hill', organizationName: 'Cedar Hill High', opportunityId: 'opp-1002', lane: 'TEAM_STORE', value: 9800, productionStatus: 'NEEDS_REVIEW', missingInfo: ['Store brand guideline approval', 'Coach photo release'], vendor: 'Stadium Threads', createdDate: '2026-04-22', vendorNotes: 'Awaiting legal sign-off.' },
  { id: 'ord-7003', organizationId: 'org-liberty-prep', organizationName: 'Liberty Prep', opportunityId: 'opp-1003', lane: 'TRAVEL_GEAR', value: 7100, productionStatus: 'BLOCKED', missingInfo: ['Artboard approval'], vendor: 'Northline Custom', createdDate: '2026-04-20', vendorNotes: 'Blocked pending AD approval.' },
];

export const activities: Activity[] = [
  { id: 'act-1', entityType: 'OPPORTUNITY', entityId: 'opp-1001', message: 'Invoice follow-up sent to procurement.', timestamp: '2026-04-27T12:00:00Z', user: 'Maya Cole' },
  { id: 'act-2', entityType: 'ORGANIZATION', entityId: 'org-cedar-hill', message: 'Booster committee requested revised plan.', timestamp: '2026-04-26T09:10:00Z', user: 'Dana Holt' },
];


export const revenueLanes: RevenueLane[] = ['UNIFORM', 'TRAVEL_GEAR', 'TEAM_STORE', 'LETTERMAN'];
export const opportunityStages: OpportunityStage[] = ['LEAD_ASSIGNED','CONTACTED','DISCOVERY','MOCKUP_REQUESTED','MOCKUP_DELIVERED','INVOICE_SENT','DECISION_PENDING','CLOSED_WON','CLOSED_LOST'];
export const reportsSummary = { weeklySummary: { pipelineAdded: 64000, closedWon: 21000, newOrganizations: 5, blockedOrders: 1 }, monthlySummary: { pipelineTotal: 289000, closedWon: 98000, winRate: 36, averageDeal: 18400 }, lanePerformance: [ { lane: 'UNIFORM' as RevenueLane, pipeline: 120000, won: 52000, winRate: 43 }, { lane: 'TRAVEL_GEAR' as RevenueLane, pipeline: 54000, won: 18000, winRate: 33 }, { lane: 'TEAM_STORE' as RevenueLane, pipeline: 76000, won: 21000, winRate: 28 }, { lane: 'LETTERMAN' as RevenueLane, pipeline: 39000, won: 7000, winRate: 18 } ], repPerformance: [ { rep: 'Maya Cole', pipeline: 102000, won: 32000, openDeals: 3 }, { rep: 'Evan Shaw', pipeline: 76000, won: 22000, openDeals: 2 } ] };
export const opsWorkspaceQueue = { NEEDS_REVIEW: orders.filter((o) => o.productionStatus === 'NEEDS_REVIEW'), READY_FOR_VENDOR: orders.filter((o) => o.productionStatus === 'READY_FOR_VENDOR'), IN_PRODUCTION: orders.filter((o) => o.productionStatus === 'IN_PRODUCTION'), BLOCKED: orders.filter((o) => o.productionStatus === 'BLOCKED'), COMPLETED: orders.filter((o) => o.productionStatus === 'COMPLETED') };
