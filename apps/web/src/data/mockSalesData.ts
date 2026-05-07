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


export const opportunityStages: OpportunityStage[] = ['LEAD_ASSIGNED', 'CONTACTED', 'DISCOVERY', 'MOCKUP_REQUESTED', 'MOCKUP_DELIVERED', 'INVOICE_SENT', 'DECISION_PENDING', 'CLOSED_WON', 'CLOSED_LOST'];

export const teamMembers: TeamMember[] = [
  { id: 'u-owner', name: 'Coach Bradshaw', role: 'OWNER', territoryIds: ['metro', 'north', 'west', 'south'], active: true },
  { id: 'u-director', name: 'Dana Holt', role: 'DIRECTOR', territoryIds: ['metro', 'north', 'west', 'south'], active: true },
  { id: 'u-rep-maya', name: 'Maya Cole', role: 'REP', territoryIds: ['metro'], active: true },
  { id: 'u-rep-evan', name: 'Evan Shaw', role: 'REP', territoryIds: ['north'], active: true },
  { id: 'u-rep-jules', name: 'Jules Park', role: 'REP', territoryIds: ['west'], active: true },
  { id: 'u-rep-erin', name: 'Erin Wade', role: 'REP', territoryIds: ['south'], active: true },
  { id: 'u-rep-noah', name: 'Noah Briggs', role: 'REP', territoryIds: ['metro', 'west'], active: true },
];

const cities = [
  ['Maple Grove High', 'Maple Grove', 'MN'],
  ['Eden Prairie High', 'Eden Prairie', 'MN'],
  ['Champlin Park High', 'Champlin', 'MN'],
  ['Elk River High', 'Elk River', 'MN'],
  ['Blaine High', 'Blaine', 'MN'],
  ['Lakeville North High', 'Lakeville', 'MN'],
  ['Rosemount High', 'Rosemount', 'MN'],
  ['Burnsville High', 'Burnsville', 'MN'],
  ['Wayzata High', 'Plymouth', 'MN'],
  ['Mounds View High', 'Arden Hills', 'MN'],
];

const reps = teamMembers.filter((t) => t.role === 'REP').map((r) => r.name);
const nextActions = ['Call AD', 'Send mockup', 'Review invoice', 'Schedule discovery', 'Confirm roster'];
const territories: TerritoryId[] = ['metro', 'north', 'west', 'south'];

export const organizations: Organization[] = Array.from({ length: 112 }).map((_, i) => {
  const base = cities[i % cities.length];
  const rep = reps[i % reps.length];
  const territory = territories[i % territories.length];
  const laneBase = 8000 + (i % 8) * 1800;
  return {
    id: `org-${i + 1}`,
    name: `${base[0]} ${Math.floor(i / cities.length) + 1}`,
    city: base[1],
    state: base[2],
    assignedRep: rep,
    assignedDirector: 'Dana Holt',
    territory,
    coverageStatus: i % 5 === 0 ? 'UNTOUCHED' : i % 5 === 1 ? 'CONTACTED' : i % 5 === 2 ? 'ACTIVE' : i % 5 === 3 ? 'ACTIVE' : 'CLOSED',
    priority: i % 4 === 0 ? 'HIGH' : i % 4 === 1 ? 'MEDIUM' : 'LOW',
    pipelineValue: 42000 + (i % 20) * 3200,
    status: i % 3 === 0 ? 'ACTIVE' : i % 3 === 1 ? 'WATCH' : 'NEW',
    nextAction: nextActions[i % nextActions.length],
    lastActivity: `2026-04-${String((i % 28) + 1).padStart(2, '0')}`,
    expansionRecommendation: 'Expand into Team Store after Uniform conversion and add Travel Gear for playoffs.',
    laneStatuses: {
      UNIFORM: { status: i % 5 === 4 ? 'WON' : 'ACTIVE', estimatedValue: laneBase + 12000, activeOpportunityCount: 1, nextAction: 'Finalize sizing' },
      TRAVEL_GEAR: { status: i % 3 === 0 ? 'ACTIVE' : 'OPEN', estimatedValue: laneBase + 7000, activeOpportunityCount: 1, nextAction: 'Confirm SKUs' },
      TEAM_STORE: { status: i % 4 === 0 ? 'WON' : 'OPEN', estimatedValue: laneBase + 6000, activeOpportunityCount: 1, nextAction: 'Approve launch plan' },
      LETTERMAN: { status: i % 7 === 0 ? 'LOST' : 'OPEN', estimatedValue: laneBase + 5000, activeOpportunityCount: 0, nextAction: 'Review senior interest' },
    },
  };
});

const sports = ['Football', 'Basketball', 'Baseball', 'Softball', 'Volleyball', 'Soccer', 'All Athletics'];
const seasons = ['FA26', 'WI26', 'SP27'];

export const opportunities: Opportunity[] = (() => {
    const stageDistribution = {
      LEAD_ASSIGNED: 60,
      CONTACTED: 40,
      DISCOVERY: 20,
      MOCKUP_REQUESTED: 15,
      MOCKUP_DELIVERED: 10,
      INVOICE_SENT: 5,
      DECISION_PENDING: 5,
      CLOSED_WON: 10,
      CLOSED_LOST: 21,
    };

    function getRandomDateWithinLast50Days() {
      const today = new Date('2026-05-05');
      const fiftyDaysAgo = new Date(today);
      fiftyDaysAgo.setDate(today.getDate() - 50);
      const randomDate = new Date(fiftyDaysAgo.getTime() + Math.random() * (today.getTime() - fiftyDaysAgo.getTime()));
      return randomDate.toISOString().split('T')[0];
    }

    const opportunities: Opportunity[] = [];
    let opportunityCounter = 0;

    for (const stage in stageDistribution) {
        const count = stageDistribution[stage as OpportunityStage];
        for (let i = 0; i < count; i++) {
            const org = organizations[opportunityCounter % organizations.length];
            const lane = revenueLanes[opportunityCounter % revenueLanes.length];
            const sport = sports[opportunityCounter % sports.length];
            const season = seasons[opportunityCounter % seasons.length];
            const value = 11000 + Math.random() * 6000;
            const probMap: Record<OpportunityStage, number> = { LEAD_ASSIGNED: 20, CONTACTED: 30, DISCOVERY: 40, MOCKUP_REQUESTED: 55, MOCKUP_DELIVERED: 68, INVOICE_SENT: 80, DECISION_PENDING: 74, CLOSED_WON: 100, CLOSED_LOST: 0 };
            
            opportunities.push({
                id: `opp-${1000 + opportunityCounter}`,
                title: `${sport} ${season} — ${lane.replace('_', ' ')}`,
                organizationId: org.id,
                organizationName: org.name,
                lane,
                sport,
                season,
                stage: stage as OpportunityStage,
                value,
                assignedRep: org.assignedRep,
                nextAction: nextActions[(opportunityCounter + 1) % nextActions.length],
                lastActivity: getRandomDateWithinLast50Days(),
                closeProbability: probMap[stage as OpportunityStage],
            });
            opportunityCounter++;
        }
    }
    return opportunities;
})();

const orderBase = opportunities.filter((o) => ['CLOSED_WON', 'INVOICE_SENT', 'DECISION_PENDING'].includes(o.stage)).slice(0, 96);

export const orders: Order[] = orderBase.map((opp, i) => ({
  id: `ord-${7000 + i}`,
  organizationId: opp.organizationId,
  organizationName: opp.organizationName,
  opportunityId: opp.id,
  lane: opp.lane,
  value: Math.round(opp.value * 0.9),
  productionStatus: i % 5 === 0 ? 'NEEDS_REVIEW' : i % 5 === 1 ? 'READY_FOR_VENDOR' : i % 5 === 2 ? 'IN_PRODUCTION' : i % 5 === 3 ? 'BLOCKED' : 'COMPLETED',
  missingInfo: i % 5 === 3 ? ['Roster confirmation', 'Final art approval'] : i % 5 === 0 ? ['PO attachment'] : [],
  vendor: i % 2 === 0 ? 'Prime Athletics' : 'Stadium Threads',
  createdDate: `2026-04-${String((i % 30) + 1).padStart(2, '0')}`,
  vendorNotes: i % 5 === 3 ? 'Blocked pending approvals.' : 'On schedule.',
}));

export const activities: Activity[] = Array.from({ length: 160 }).map((_, i) => {
  const opp = opportunities[i % opportunities.length];
  const rep = reps[i % reps.length];
  return {
    id: `act-${i + 1}`,
    entityType: 'OPPORTUNITY',
    entityId: opp.id,
    message: `${opp.organizationName}: ${opp.stage.replace(/_/g, ' ')} updated and next step assigned.`,
    timestamp: `2026-04-${String((i % 30) + 1).padStart(2, '0')}T1${i % 10}:00:00Z`,
    user: rep,
  };
});

export const reportsSummary = {
  weeklySummary: { pipelineAdded: 312000, closedWon: 88000, newOrganizations: organizations.filter((o) => o.status === 'NEW').length, blockedOrders: orders.filter((o) => o.productionStatus === 'BLOCKED').length },
  monthlySummary: { pipelineTotal: opportunities.reduce((s, o) => s + o.value, 0), closedWon: opportunities.filter((o) => o.stage === 'CLOSED_WON').reduce((s, o) => s + o.value, 0), winRate: 34, averageDeal: 18600 },
  lanePerformance: revenueLanes.map((lane) => ({ lane, pipeline: opportunities.filter((o) => o.lane === lane).reduce((s, o) => s + o.value, 0), won: opportunities.filter((o) => o.lane === lane && o.stage === 'CLOSED_WON').reduce((s, o) => s + o.value, 0), winRate: 32 + revenueLanes.indexOf(lane) * 4 })),
  repPerformance: reps.map((rep) => ({ rep, pipeline: opportunities.filter((o) => o.assignedRep === rep).reduce((s, o) => s + o.value, 0), won: opportunities.filter((o) => o.assignedRep === rep && o.stage === 'CLOSED_WON').reduce((s, o) => s + o.value, 0), openDeals: opportunities.filter((o) => o.assignedRep === rep && !['CLOSED_WON', 'CLOSED_LOST'].includes(o.stage)).length })),
};

export const opsWorkspaceQueue = {
  NEEDS_REVIEW: orders.filter((o) => o.productionStatus === 'NEEDS_REVIEW'),
  READY_FOR_VENDOR: orders.filter((o) => o.productionStatus === 'READY_FOR_VENDOR'),
  IN_PRODUCTION: orders.filter((o) => o.productionStatus === 'IN_PRODUCTION'),
  BLOCKED: orders.filter((o) => o.productionStatus === 'BLOCKED'),
  COMPLETED: orders.filter((o) => o.productionStatus === 'COMPLETED'),
};