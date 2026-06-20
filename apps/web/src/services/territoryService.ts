import { getStoredUser } from '../auth';
import { repCoverage, territories, untouchedAccountsQueue } from '../data/territoryMock';
import type { TerritoryId } from '../data/mockSalesData';
import { listOrganizations } from './organizationsService';
import { getManagedTerritoriesForDirector } from './usersService';

function allowedTerritoryIds() {
  const user = getStoredUser();
  if (!user || user.role === 'ADMIN' || user.role === 'REGIONAL_DIRECTOR') return null;
  if (user.role === 'DIRECTOR') {
    const explicitTerritories = getManagedTerritoriesForDirector(user.name);
    const organizationTerritories = listOrganizations({})
      .map((org) => org.territory)
      .filter((territory): territory is TerritoryId => Boolean(territory));
    return new Set<TerritoryId>([...explicitTerritories, ...organizationTerritories]);
  }
  return new Set<string>();
}

export const listTerritories = () => {
  const allowed = allowedTerritoryIds();
  if (!allowed) return territories;
  return territories.filter((t) => allowed.has(t.id));
};

export const getRepCoverage = () => {
  const allowed = allowedTerritoryIds();
  if (!allowed) return repCoverage;
  return repCoverage.filter((r) => allowed.has(r.territory));
};

export const getUntouchedAccounts = () => {
  const allowed = allowedTerritoryIds();
  if (!allowed) return untouchedAccountsQueue;
  return untouchedAccountsQueue.filter((a) => allowed.has(a.territory));
};

export const getAssignmentHealth = (accountsAssigned: number) => {
  if (accountsAssigned < 15) return 'Underassigned';
  if (accountsAssigned > 35) return 'Overloaded';
  return 'Balanced';
};
