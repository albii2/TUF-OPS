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

const territoryNames: Record<TerritoryId, string> = {
  metro: 'TUF Metro',
  north: 'North Zone',
  west: 'West Zone',
  south: 'South Zone',
};

const stageIsNearClose = (stage: string) => ['MOCKUP_DELIVERED', 'INVOICE_SENT', 'DECISION_PENDING'].includes(stage);
const stageIsStuck = (stage: string) => ['CONTACTED', 'DISCOVERY', 'MOCKUP_REQUESTED'].includes(stage);

export const territories: Territory[] = (Object.keys(territoryNames) as TerritoryId[]).map((id) => {
  const territoryOrganizations = organizations.filter((organization) => organization.territory === id);
  const territoryOpportunities = opportunities.filter((opportunity) => territoryOrganizations.some((organization) => organization.id === opportunity.organizationId));
  return {
    id,
    name: territoryNames[id],
    accounts: territoryOrganizations.length,
    untouched: territoryOrganizations.filter((organization) => organization.coverageStatus === 'UNTOUCHED').length,
    pipeline: territoryOpportunities.filter((opportunity) => !['CLOSED_WON', 'CLOSED_LOST'].includes(opportunity.stage)).reduce((sum, opportunity) => sum + opportunity.value, 0),
    closed: territoryOpportunities.filter((opportunity) => opportunity.stage === 'CLOSED_WON').reduce((sum, opportunity) => sum + opportunity.value, 0),
    lanePenetration: {
      uniform: territoryOpportunities.filter((opportunity) => opportunity.lane === 'UNIFORM').length,
      teamStore: territoryOpportunities.filter((opportunity) => opportunity.lane === 'TEAM_STORE').length,
      travelGear: territoryOpportunities.filter((opportunity) => opportunity.lane === 'TRAVEL_GEAR').length,
      letterman: territoryOpportunities.filter((opportunity) => opportunity.lane === 'LETTERMAN').length,
    },
  };
});

export const repCoverage: WorkloadRow[] = teamMembers
  .filter((user) => user.role === 'REP' && user.active)
  .map((rep) => {
    const repOrgs = organizations.filter((organization) => organization.assignedRep === rep.name);
    const repOpps = opportunities.filter((opportunity) => opportunity.assignedRep === rep.name);
    const territory = rep.territoryIds[0] ?? 'metro';
    return {
      rep: rep.name,
      territory,
      assignedAccounts: repOrgs.length,
      untouchedAccounts: repOrgs.filter((organization) => organization.coverageStatus === 'UNTOUCHED').length,
      activeOpportunities: repOpps.filter((opportunity) => !['CLOSED_WON', 'CLOSED_LOST'].includes(opportunity.stage)).length,
      nearCloseOpportunities: repOpps.filter((opportunity) => stageIsNearClose(opportunity.stage)).length,
      stuckOpportunities: repOpps.filter((opportunity) => stageIsStuck(opportunity.stage)).length,
      closedWonMTD: repOpps.filter((opportunity) => opportunity.stage === 'CLOSED_WON').reduce((sum, opportunity) => sum + opportunity.value, 0),
      pipelineValue: repOpps.reduce((sum, opportunity) => sum + opportunity.value, 0),
    };
  });

export const untouchedAccountsQueue = organizations
  .filter((organization) => organization.coverageStatus === 'UNTOUCHED')
  .map((organization) => ({ id: organization.id, name: organization.name, territory: organization.territory, state: organization.state, assignedRep: organization.assignedRep }));
