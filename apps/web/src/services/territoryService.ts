/**
 * TUF Ops 2.0 — Territory read client (frontend).
 *
 * S4 SEVERANCE: this module (and the fabricated territory mock module it
 * imported) used to build every territory metric from fabricated
 * `organizations`, `opportunities` and `teamMembers` fixture objects. Those
 * aggregates shipped to production in the `/territory` and `/territory/static`
 * bundles. The fixture is GONE.
 *
 * Every figure below is now derived at request time from the REAL API:
 * `GET /organizations` (accounts / untouched) and `GET /opportunities`
 * (pipeline / closed / lane penetration). A figure that cannot be computed from
 * the API is genuinely absent — never a fabricated row and never a substituted
 * number. The app has no dedicated `/territories` endpoint, so the territory
 * identities (the four Minnesota zones) are the domain constants they already
 * are, and the metrics are a real projection over the live org/opportunity data
 * the rest of the app already reads.
 */

import type { RevenueLane, TerritoryId } from '@tuf/shared';
import { getStoredUser } from '../auth';
import { listOrganizations } from './organizationsService';
import { listOpportunities } from './opportunitiesService';
import { getManagedTerritoriesForDirector, listUsersAsync } from './usersService';

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

/** The four live Minnesota zones rendered by the territory surfaces. */
const CORE_TERRITORY_IDS: TerritoryId[] = ['metro', 'north', 'west', 'south'];

const territoryNames: Record<TerritoryId, string> = {
  metro: 'TUF Metro',
  north: 'TUF NORTH',
  west: 'TUF WEST',
  south: 'TUF SOUTH',
  il: 'TUF ILLINOIS',
  wi: 'TUF WISCONSIN',
};

function stageIsNearClose(stage: string): boolean {
  return ['MOCKUP_DELIVERED', 'INVOICE_SENT', 'DECISION_PENDING'].includes(stage);
}

function stageIsStuck(stage: string): boolean {
  return ['CONTACTED', 'DISCOVERY', 'MOCKUP_REQUESTED'].includes(stage);
}

function laneCount(lanes: RevenueLane[] | undefined, lane: RevenueLane): number {
  return Array.isArray(lanes) && lanes.includes(lane) ? 1 : 0;
}

async function allowedTerritoryIds(): Promise<Set<TerritoryId> | null> {
  const user = getStoredUser();
  if (!user || user.role === 'ADMIN' || user.role === 'REGIONAL_DIRECTOR' || user.role === 'OPERATIONS') return null;
  if (user.role === 'DIRECTOR') {
    const explicitTerritories = getManagedTerritoriesForDirector(user.name);
    const orgs = await listOrganizations({});
    const organizationTerritories = orgs
      .map((org) => org.territory)
      .filter((territory): territory is TerritoryId => Boolean(territory));
    return new Set<TerritoryId>([...explicitTerritories, ...organizationTerritories]);
  }
  return new Set<TerritoryId>();
}

function buildTerritory(
  id: TerritoryId,
  orgs: Awaited<ReturnType<typeof listOrganizations>>,
  opps: Awaited<ReturnType<typeof listOpportunities>>,
): Territory {
  const territoryOrganizations = orgs.filter((org) => org.territory === id);
  const orgIds = new Set(territoryOrganizations.map((org) => org.id));
  const territoryOpportunities = opps.filter((opportunity) => orgIds.has(opportunity.organizationId));
  return {
    id,
    name: territoryNames[id],
    accounts: territoryOrganizations.length,
    untouched: territoryOrganizations.filter((org) => org.coverageStatus === 'UNTOUCHED').length,
    pipeline: territoryOpportunities
      .filter((opportunity) => !['CLOSED_WON', 'CLOSED_LOST'].includes(opportunity.stage))
      .reduce((sum, opportunity) => sum + opportunity.value, 0),
    closed: territoryOpportunities
      .filter((opportunity) => opportunity.stage === 'CLOSED_WON')
      .reduce((sum, opportunity) => sum + opportunity.value, 0),
    lanePenetration: {
      uniform: territoryOpportunities.reduce((sum, o) => sum + laneCount(o.lanes, 'UNIFORM'), 0),
      teamStore: territoryOpportunities.reduce((sum, o) => sum + laneCount(o.lanes, 'TEAM_STORE'), 0),
      travelGear: territoryOpportunities.reduce((sum, o) => sum + laneCount(o.lanes, 'TRAVEL_GEAR'), 0),
      letterman: territoryOpportunities.reduce((sum, o) => sum + laneCount(o.lanes, 'LETTERMAN'), 0),
    },
  };
}

export const listTerritories = async (): Promise<Territory[]> => {
  const allowed = await allowedTerritoryIds();
  const [orgs, opps] = await Promise.all([listOrganizations({}), listOpportunities({})]);
  const territories = CORE_TERRITORY_IDS.map((id) => buildTerritory(id, orgs, opps));
  if (!allowed) return territories;
  return territories.filter((t) => allowed.has(t.id));
};

export const getRepCoverage = async (): Promise<WorkloadRow[]> => {
  const allowed = await allowedTerritoryIds();
  const [users, orgs, opps] = await Promise.all([
    listUsersAsync(),
    listOrganizations({}),
    listOpportunities({}),
  ]);
  const rows = users
    .filter((user) => user.role === 'REP' && user.status === 'ACTIVE')
    .map((rep): WorkloadRow => {
      const repOrgs = orgs.filter((org) => org.assignedRep === rep.displayName);
      const repOpps = opps.filter((opp) => opp.assignedRep === rep.displayName);
      const territory = (CORE_TERRITORY_IDS as string[]).includes(rep.territory)
        ? (rep.territory as TerritoryId)
        : CORE_TERRITORY_IDS[0];
      return {
        rep: rep.displayName,
        territory,
        assignedAccounts: repOrgs.length,
        untouchedAccounts: repOrgs.filter((org) => org.coverageStatus === 'UNTOUCHED').length,
        activeOpportunities: repOpps.length,
        nearCloseOpportunities: repOpps.filter((opp) => stageIsNearClose(opp.stage)).length,
        stuckOpportunities: repOpps.filter((opp) => stageIsStuck(opp.stage)).length,
        closedWonMTD: repOpps
          .filter((opp) => opp.stage === 'CLOSED_WON')
          .reduce((sum, opp) => sum + opp.value, 0),
        pipelineValue: repOpps.reduce((sum, opp) => sum + opp.value, 0),
      };
    });
  if (!allowed) return rows;
  return rows.filter((row) => allowed.has(row.territory));
};

export const getUntouchedAccounts = async () => {
  const allowed = await allowedTerritoryIds();
  const orgs = await listOrganizations({ coverageStatus: 'UNTOUCHED' });
  const rows = orgs.map((org) => ({
    id: org.id,
    name: org.name,
    territory: org.territory,
    state: org.state,
    assignedRep: org.assignedRep,
  }));
  if (!allowed) return rows;
  return rows.filter((row) => allowed.has(row.territory));
};

export const getAssignmentHealth = (accountsAssigned: number) => {
  if (accountsAssigned < 15) return 'Underassigned';
  if (accountsAssigned > 35) return 'Overloaded';
  return 'Balanced';
};
