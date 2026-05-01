import { getStoredUser } from '../auth';
import { organizations, teamMembers, type CoverageStatus, type Organization, type TerritoryId } from '../data/mockSalesData';
import { DATA_MODE } from './dataMode';

export type OrganizationListParams = {
  search?: string;
  status?: 'ALL' | Organization['status'];
  rep?: string;
  territory?: 'ALL' | TerritoryId;
  director?: 'ALL' | string;
  coverageStatus?: 'ALL' | CoverageStatus;
  priority?: 'ALL' | Organization['priority'];
};

const STALE_DAYS = 14;
const now = new Date('2026-05-01T00:00:00Z').getTime();

function getRoleScopedOrganizations() {
  const user = getStoredUser();
  if (!user || user.role === 'OWNER') return organizations;

  if (user.role === 'DIRECTOR') {
    const directorProfile = teamMembers.find((m) => m.name === user.name && m.role === 'DIRECTOR');
    const zoneSet = new Set(directorProfile?.territoryIds ?? []);
    return organizations.filter((org) => org.assignedDirector === user.name || zoneSet.has(org.territory));
  }

  if (user.role === 'REP') return organizations.filter((org) => org.assignedRep === user.name);
  return organizations;
}

export function listOrganizations(params: OrganizationListParams = {}): Organization[] {
  if (DATA_MODE !== 'mock') return [];
  return getRoleScopedOrganizations().filter((org) => {
    const matchesSearch = !(params.search ?? '').trim() || [org.name, org.city, org.state, org.assignedRep, org.assignedDirector].join(' ').toLowerCase().includes((params.search ?? '').toLowerCase());
    const matchesStatus = !params.status || params.status === 'ALL' || org.status === params.status;
    const matchesRep = !params.rep || params.rep === 'ALL' || org.assignedRep === params.rep;
    const matchesTerritory = !params.territory || params.territory === 'ALL' || org.territory === params.territory;
    const matchesDirector = !params.director || params.director === 'ALL' || org.assignedDirector === params.director;
    const matchesCoverage = !params.coverageStatus || params.coverageStatus === 'ALL' || org.coverageStatus === params.coverageStatus;
    const matchesPriority = !params.priority || params.priority === 'ALL' || org.priority === params.priority;
    return matchesSearch && matchesStatus && matchesRep && matchesTerritory && matchesDirector && matchesCoverage && matchesPriority;
  });
}

export function getOrganizationById(id: string): Organization | undefined {
  if (DATA_MODE !== 'mock') return undefined;
  return getRoleScopedOrganizations().find((org) => org.id === id);
}

export function listUntouchedAccounts() {
  return listOrganizations({}).filter((o) => o.coverageStatus === 'UNTOUCHED');
}

export function listStaleAccounts() {
  return listOrganizations({}).filter((o) => {
    const last = new Date(o.lastActivity).getTime();
    return Number.isFinite(last) && (now - last) / (1000 * 60 * 60 * 24) >= STALE_DAYS;
  });
}

export function listAccountsNeedingAction() {
  return listOrganizations({}).filter((o) => o.coverageStatus !== 'CLOSED' && o.nextAction.trim().length > 0);
}
