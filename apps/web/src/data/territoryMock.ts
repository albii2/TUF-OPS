import { organizations, opportunities, teamMembers, type TerritoryId } from './mockSalesData';

export type Territory = {
  id: TerritoryId;
  name: string;
  accounts: number;
  untouched: number;
  pipeline: number;
  closed: number;
  lanePenetration: { uniform: number; teamStore: number; travelGear: number; letterman: number };
};

export type WorkloadRow = {
  rep: string;
  territory: TerritoryId;
  assignedAccounts: number;
  untouchedAccounts: number;
  activeOpportunities: number;
  nearCloseOpportunities: number;
  stuckOpportunities: number;
  closedWonMTD: number;
  pipelineValue: number;
};

export const territories: Territory[] = [
  { id: 'metro', name: 'TUF Metro', accounts: 112, untouched: 38, pipeline: 185000, closed: 42000, lanePenetration: { uniform: 18, teamStore: 9, travelGear: 6, letterman: 4 } },
  { id: 'north', name: 'TUF NORTH', accounts: 76, untouched: 29, pipeline: 94000, closed: 18000, lanePenetration: { uniform: 14, teamStore: 7, travelGear: 5, letterman: 3 } },
  { id: 'west', name: 'TUF WEST', accounts: 64, untouched: 22, pipeline: 73000, closed: 12000, lanePenetration: { uniform: 13, teamStore: 6, travelGear: 4, letterman: 2 } },
  { id: 'south', name: 'TUF SOUTH', accounts: 44, untouched: 16, pipeline: 60000, closed: 14000, lanePenetration: { uniform: 11, teamStore: 5, travelGear: 3, letterman: 2 } },
];

const stageIsNearClose = (stage: string) => ['MOCKUP_DELIVERED', 'INVOICE_SENT', 'DECISION_PENDING'].includes(stage);
const stageIsStuck = (stage: string) => ['CONTACTED', 'DISCOVERY', 'MOCKUP_REQUESTED'].includes(stage);

export const repCoverage: WorkloadRow[] = teamMembers
  .filter((u) => u.role === 'REP' && u.active)
  .map((rep) => {
    const repOrgs = organizations.filter((o) => o.assignedRep === rep.name);
    const repOpps = opportunities.filter((o) => o.assignedRep === rep.name);
    const territory = rep.territoryIds[0] ?? 'metro';
    return {
      rep: rep.name,
      territory,
      assignedAccounts: repOrgs.length,
      untouchedAccounts: repOrgs.filter((o) => o.coverageStatus === 'UNTOUCHED').length,
      activeOpportunities: repOpps.length,
      nearCloseOpportunities: repOpps.filter((o) => stageIsNearClose(o.stage)).length,
      stuckOpportunities: repOpps.filter((o) => stageIsStuck(o.stage)).length,
      closedWonMTD: repOpps.filter((o) => o.stage === 'CLOSED_WON').reduce((sum, o) => sum + o.value, 0),
      pipelineValue: repOpps.reduce((sum, o) => sum + o.value, 0),
    };
  });

export const untouchedAccountsQueue = organizations
  .filter((o) => o.coverageStatus === 'UNTOUCHED')
  .map((o) => ({ id: o.id, name: o.name, territory: o.territory, state: o.state, assignedRep: o.assignedRep }));
