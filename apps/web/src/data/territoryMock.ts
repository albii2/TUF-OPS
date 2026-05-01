import { organizations, opportunities } from './mockSalesData';

export type Territory = {
  id: string;
  name: string;
  state: string;
  region: string;
  directorId: string;
  repIds: string[];
  totalAccounts: number;
  assignedAccounts: number;
  untouchedAccounts: number;
  pipelineValue: number;
  closedRevenue: number;
  lanePenetration: { uniform: number; teamStore: number; travelGear: number; letterman: number };
  status: 'BUILDING' | 'ACTIVE' | 'SATURATED';
};

export const territories: Territory[] = [
  {
    id: 'ter-mn-north-metro', name: 'MN - North Metro', state: 'MN', region: 'Midwest', directorId: 'dir-dana', repIds: ['rep-maya', 'rep-evan'],
    totalAccounts: 296, assignedAccounts: 124, untouchedAccounts: 172, pipelineValue: 412000, closedRevenue: 86000,
    lanePenetration: { uniform: 18, teamStore: 9, travelGear: 6, letterman: 4 }, status: 'ACTIVE',
  },
];

export const untouchedAccountsQueue = organizations.map((o) => ({ id: o.id, name: o.name, state: o.state })).slice(0, 20);
export const repCoverage = [
  { rep: 'Maya Cole', accounts: 35, pipeline: 80000, closed: 12000, untouched: 10 },
  { rep: 'Evan Shaw', accounts: 28, pipeline: 61000, closed: 9000, untouched: 12 },
];

export const territoryPressure = {
  untouchedAccounts: 172,
  stuckDeals: opportunities.filter((o) => o.stage === 'DECISION_PENDING').length,
  blockedOrders: 6,
};
