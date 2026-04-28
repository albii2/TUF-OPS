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

export type Organization = {
  id: string;
  name: string;
  city: string;
  state: string;
  assignedRep: string;
  assignedDirector: string;
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

export type ReportsSummary = {
  weeklySummary: { pipelineAdded: number; closedWon: number; newOrganizations: number; blockedOrders: number };
  monthlySummary: { pipelineTotal: number; closedWon: number; winRate: number; averageDeal: number };
  lanePerformance: Array<{ lane: RevenueLane; pipeline: number; won: number; winRate: number }>;
  repPerformance: Array<{ rep: string; pipeline: number; won: number; openDeals: number }>;
};

export const revenueLanes: RevenueLane[] = ['UNIFORM', 'TRAVEL_GEAR', 'TEAM_STORE', 'LETTERMAN'];
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

export const organizations: Organization[] = [
  {
    id: 'org-northview',
    name: 'Northview Academy',
    city: 'Austin',
    state: 'TX',
    assignedRep: 'Maya Cole',
    assignedDirector: 'Dana Holt',
    pipelineValue: 84200,
    status: 'ACTIVE',
    nextAction: 'Present team store rollout plan',
    lastActivity: '2026-04-27',
    expansionRecommendation: 'Open LETTERMAN lane after closing TRAVEL_GEAR refresh package.',
    laneStatuses: {
      UNIFORM: { status: 'ACTIVE', estimatedValue: 32000, activeOpportunityCount: 2, nextAction: 'Finalize roster sizing' },
      TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 18000, activeOpportunityCount: 1, nextAction: 'Confirm bag SKU mix' },
      TEAM_STORE: { status: 'WON', estimatedValue: 22000, activeOpportunityCount: 0, nextAction: 'Upsell seasonal drops' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 12200, activeOpportunityCount: 1, nextAction: 'Pitch senior package' },
    },
  },
  {
    id: 'org-cedar-hill',
    name: 'Cedar Hill High',
    city: 'Dallas',
    state: 'TX',
    assignedRep: 'Evan Shaw',
    assignedDirector: 'Dana Holt',
    pipelineValue: 65100,
    status: 'WATCH',
    nextAction: 'Follow up on invoice approval',
    lastActivity: '2026-04-26',
    expansionRecommendation: 'Convert UNIFORM renewal first, then activate TEAM_STORE in summer season.',
    laneStatuses: {
      UNIFORM: { status: 'ACTIVE', estimatedValue: 28000, activeOpportunityCount: 1, nextAction: 'Secure PO signature' },
      TRAVEL_GEAR: { status: 'LOST', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Revisit next quarter' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 21100, activeOpportunityCount: 1, nextAction: 'Review margin plan' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 16000, activeOpportunityCount: 1, nextAction: 'Collect booster feedback' },
    },
  },
  {
    id: 'org-liberty-prep',
    name: 'Liberty Prep',
    city: 'Phoenix',
    state: 'AZ',
    assignedRep: 'Maya Cole',
    assignedDirector: 'Chris Vale',
    pipelineValue: 47900,
    status: 'NEW',
    nextAction: 'Book discovery call with AD',
    lastActivity: '2026-04-25',
    expansionRecommendation: 'Fastest path is TRAVEL_GEAR starter bundle with cross-sell to UNIFORM.',
    laneStatuses: {
      UNIFORM: { status: 'OPEN', estimatedValue: 21000, activeOpportunityCount: 1, nextAction: 'Map roster counts' },
      TRAVEL_GEAR: { status: 'ACTIVE', estimatedValue: 14200, activeOpportunityCount: 1, nextAction: 'Deliver mockup v2' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 7900, activeOpportunityCount: 1, nextAction: 'Share launch checklist' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 4800, activeOpportunityCount: 0, nextAction: 'Validate demand' },
    },
  },
];

export const opportunities: Opportunity[] = [
  {
    id: 'opp-1001',
    title: 'Northview Football Uniform Renewal',
    organizationId: 'org-northview',
    organizationName: 'Northview Academy',
    lane: 'UNIFORM',
    sport: 'Football',
    season: 'Fall 2026',
    stage: 'INVOICE_SENT',
    value: 32000,
    assignedRep: 'Maya Cole',
    nextAction: 'Follow up with procurement tomorrow',
    lastActivity: '2026-04-27',
    closeProbability: 85,
  },
  {
    id: 'opp-1002',
    title: 'Cedar Hill Team Store Launch',
    organizationId: 'org-cedar-hill',
    organizationName: 'Cedar Hill High',
    lane: 'TEAM_STORE',
    sport: 'Basketball',
    season: 'Winter 2026',
    stage: 'MOCKUP_DELIVERED',
    value: 21100,
    assignedRep: 'Evan Shaw',
    nextAction: 'Collect principal sign-off',
    lastActivity: '2026-04-26',
    closeProbability: 62,
  },
  {
    id: 'opp-1003',
    title: 'Liberty Prep Travel Gear Starter',
    organizationId: 'org-liberty-prep',
    organizationName: 'Liberty Prep',
    lane: 'TRAVEL_GEAR',
    sport: 'Volleyball',
    season: 'Summer 2026',
    stage: 'DISCOVERY',
    value: 14200,
    assignedRep: 'Maya Cole',
    nextAction: 'Request final logo files',
    lastActivity: '2026-04-25',
    closeProbability: 48,
  },
  {
    id: 'opp-1004',
    title: 'Northview Letterman Expansion',
    organizationId: 'org-northview',
    organizationName: 'Northview Academy',
    lane: 'LETTERMAN',
    sport: 'Multi-sport',
    season: 'Fall 2026',
    stage: 'CONTACTED',
    value: 12200,
    assignedRep: 'Maya Cole',
    nextAction: 'Run expansion ROI walkthrough',
    lastActivity: '2026-04-24',
    closeProbability: 38,
  },
];

export const orders: Order[] = [
  {
    id: 'ord-7001',
    organizationId: 'org-northview',
    organizationName: 'Northview Academy',
    opportunityId: 'opp-1001',
    lane: 'UNIFORM',
    value: 28750,
    productionStatus: 'IN_PRODUCTION',
    missingInfo: ['Final player numbers'],
    vendor: 'Prime Athletics',
    createdDate: '2026-04-18',
    vendorNotes: 'Awaiting player number sheet before embroidery lock.',
  },
  {
    id: 'ord-7002',
    organizationId: 'org-cedar-hill',
    organizationName: 'Cedar Hill High',
    opportunityId: 'opp-1002',
    lane: 'TEAM_STORE',
    value: 9800,
    productionStatus: 'NEEDS_REVIEW',
    missingInfo: ['Store brand guideline approval', 'Coach photo release'],
    vendor: 'Stadium Threads',
    createdDate: '2026-04-22',
    vendorNotes: 'Awaiting legal sign-off.',
  },
  {
    id: 'ord-7003',
    organizationId: 'org-liberty-prep',
    organizationName: 'Liberty Prep',
    opportunityId: 'opp-1003',
    lane: 'TRAVEL_GEAR',
    value: 7100,
    productionStatus: 'BLOCKED',
    missingInfo: ['Shipping location confirmation'],
    vendor: 'Rapid Team Supply',
    createdDate: '2026-04-20',
    vendorNotes: 'Address mismatch between PO and account file.',
  },
  {
    id: 'ord-7004',
    organizationId: 'org-northview',
    organizationName: 'Northview Academy',
    opportunityId: 'opp-1004',
    lane: 'LETTERMAN',
    value: 5400,
    productionStatus: 'READY_FOR_VENDOR',
    missingInfo: [],
    vendor: 'Prime Athletics',
    createdDate: '2026-04-23',
    vendorNotes: 'Ready to send tech pack.',
  },
];

export const activities: Activity[] = [
  { id: 'act-1', entityType: 'ORGANIZATION', entityId: 'org-northview', message: 'AD requested timeline update.', timestamp: '2026-04-27 09:21', user: 'Maya Cole' },
  { id: 'act-2', entityType: 'OPPORTUNITY', entityId: 'opp-1002', message: 'Mockup delivered to principal.', timestamp: '2026-04-26 14:05', user: 'Evan Shaw' },
  { id: 'act-3', entityType: 'ORDER', entityId: 'ord-7003', message: 'Order blocked pending address verification.', timestamp: '2026-04-25 11:47', user: 'Ops Queue' },
  { id: 'act-4', entityType: 'ORGANIZATION', entityId: 'org-liberty-prep', message: 'Discovery call scheduled for Tuesday.', timestamp: '2026-04-25 08:38', user: 'Maya Cole' },
];

export const laneStatuses: Array<{ lane: RevenueLane; statuses: LaneStatus[] }> = revenueLanes.map((lane) => ({
  lane,
  statuses: organizations.map((org) => org.laneStatuses[lane].status),
}));

export const reportsSummary: ReportsSummary = {
  weeklySummary: { pipelineAdded: 46200, closedWon: 18800, newOrganizations: 3, blockedOrders: 1 },
  monthlySummary: { pipelineTotal: 197200, closedWon: 74500, winRate: 42, averageDeal: 16400 },
  lanePerformance: [
    { lane: 'UNIFORM', pipeline: 86000, won: 41200, winRate: 48 },
    { lane: 'TRAVEL_GEAR', pipeline: 39600, won: 12000, winRate: 30 },
    { lane: 'TEAM_STORE', pipeline: 50200, won: 16400, winRate: 33 },
    { lane: 'LETTERMAN', pipeline: 21400, won: 4900, winRate: 23 },
  ],
  repPerformance: [
    { rep: 'Maya Cole', pipeline: 128400, won: 50200, openDeals: 7 },
    { rep: 'Evan Shaw', pipeline: 68800, won: 24300, openDeals: 4 },
  ],
};

export const opsWorkspaceQueue: Record<Order['productionStatus'], Order[]> = {
  NEEDS_REVIEW: orders.filter((o) => o.productionStatus === 'NEEDS_REVIEW'),
  READY_FOR_VENDOR: orders.filter((o) => o.productionStatus === 'READY_FOR_VENDOR'),
  IN_PRODUCTION: orders.filter((o) => o.productionStatus === 'IN_PRODUCTION'),
  BLOCKED: orders.filter((o) => o.productionStatus === 'BLOCKED'),
  COMPLETED: orders.filter((o) => o.productionStatus === 'COMPLETED'),
};
