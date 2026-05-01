import { getStoredUser } from '../auth';
import { teamMembers } from '../data/mockSalesData';
import { repCoverage, territories, untouchedAccountsQueue } from '../data/territoryMock';

function allowedTerritoryIds() {
  const user = getStoredUser();
  if (!user || user.role === 'OWNER') return null;
  if (user.role === 'DIRECTOR') {
    const director = teamMembers.find((m) => m.name === user.name && m.role === 'DIRECTOR');
    return new Set(director?.territoryIds ?? []);
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
