import { getStoredUser } from '../auth';
import { repCoverage, territories, untouchedAccountsQueue } from '../data/territoryMock';
import { getManagedTerritoriesForDirector } from './usersService';

function allowedTerritoryIds() {
  const user = getStoredUser();
  if (!user || user.role === 'OWNER') return null;
  if (user.role === 'DIRECTOR') {
    return new Set(getManagedTerritoriesForDirector(user.name));
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
