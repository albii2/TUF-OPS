import { organizations, opportunities, teamMembers } from './mockSalesData';
import type { TerritoryId } from '@tuf/shared';

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

const territoryNames: Record<TerritoryId, string> = {
  metro: 'TUF Metro',
  north: 'TUF NORTH',
  west: 'TUF WEST',
  south: 'TUF SOUTH',
  il: 'TUF ILLINOIS',
  wi: 'TUF WISCONSIN',
};

export const territories: Territory[] = (['metro', 'north', 'west', 'south'] as TerritoryId[]).map((id) => {
  const territoryOrganizations = organizations.filter((org) => org.territory === id);
  const territoryOpportunities = opportunities.filter((opportunity) => territoryOrganizations.some((org) => org.id === opportunity.organizationId));
  return {
    id,
    name: territoryNames[id],
    accounts: territoryOrganizations.length,
    untouched: territoryOrganizations.filter((org) => org.coverageStatus === 'UNTOUCHED').length,
    pipeline: territoryOpportunities.filter((opportunity) => !['CLOSED_WON', 'CLOSED_LOST'].includes(opportunity.stage)).reduce((sum, opportunity) => sum + opportunity.value, 0),
    closed: territoryOpportunities.filter((opportunity) => opportunity.stage === 'CLOSED_WON').reduce((sum, opportunity) => sum + opportunity.value, 0),
    lanePenetration: {
      uniform: territoryOpportunities.filter((opportunity) => opportunity.lanes.includes('UNIFORM')).length,
      teamStore: territoryOpportunities.filter((opportunity) => opportunity.lanes.includes('TEAM_STORE')).length,
      travelGear: territoryOpportunities.filter((opportunity) => opportunity.lanes.includes('TRAVEL_GEAR')).length,
      letterman: territoryOpportunities.filter((opportunity) => opportunity.lanes.includes('LETTERMAN')).length,
    },
  };
});

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
