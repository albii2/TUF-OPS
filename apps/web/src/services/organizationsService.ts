import { getStoredUser } from '../auth';
import { organizations, teamMembers, type CoverageStatus, type Organization, type TerritoryId } from '../data/mockSalesData';
import type { NormalizedLead } from '../utils/leadImport';
import { normalizeAccountName } from '../utils/naming';
import { DATA_MODE } from './dataMode';

export type OrganizationListParams = {
  search?: string;
  status?: 'ALL' | Organization['status'];
  rep?: string;
  territory?: 'ALL' | TerritoryId;
  director?: 'ALL' | string;
  coverageStatus?: 'ALL' | CoverageStatus;
  priority?: 'ALL' | Organization['priority'];
  refreshKey?: number;
};

const STALE_DAYS = 14;
const now = new Date('2026-05-01T00:00:00Z').getTime();
const LOCAL_ORGANIZATIONS_KEY = 'tuf_ops_mock_organizations_v1';

function readLocalOrganizations(): Organization[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ORGANIZATIONS_KEY) || '[]') as Organization[];
  } catch {
    return [];
  }
}

function writeLocalOrganizations(rows: Organization[]) {
  localStorage.setItem(LOCAL_ORGANIZATIONS_KEY, JSON.stringify(rows));
}

function getAllOrganizations() {
  const localRows = readLocalOrganizations();
  const localIds = new Set(localRows.map((row) => row.id));
  return [...localRows, ...organizations.filter((row) => !localIds.has(row.id))];
}

function getRoleScopedOrganizations() {
  const user = getStoredUser();
  const allOrganizations = getAllOrganizations();
  if (!user || user.role === 'OWNER' || user.role === 'OPS') return allOrganizations;

  if (user.role === 'DIRECTOR') {
    const directorProfile = teamMembers.find((m) => m.name === user.name && m.role === 'DIRECTOR');
    const zoneSet = new Set(directorProfile?.territoryIds ?? []);
    return allOrganizations.filter((org) => org.assignedDirector === user.name || zoneSet.has(org.territory));
  }

  if (user.role === 'REP') return allOrganizations.filter((org) => org.assignedRep === user.name);
  return allOrganizations;
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

function buildMockOrganization(input: {
  id: string;
  name: string;
  city: string;
  state: string;
  assignedRep: string;
  assignedDirector: string;
  territory: TerritoryId;
  priority?: Organization['priority'];
  nextAction?: string;
}): Organization {
  return {
    id: input.id,
    name: normalizeAccountName(input.name),
    city: input.city,
    state: input.state.toUpperCase(),
    assignedRep: input.assignedRep,
    assignedDirector: input.assignedDirector,
    territory: input.territory,
    coverageStatus: 'UNTOUCHED',
    priority: input.priority ?? 'MEDIUM',
    pipelineValue: 0,
    status: 'NEW',
    nextAction: input.nextAction ?? 'Call primary contact and confirm sports coverage',
    lastActivity: new Date().toISOString().slice(0, 10),
    expansionRecommendation: 'Start with Uniform discovery, then map Travel Gear and Team Store potential by sport.',
    laneStatuses: {
      UNIFORM: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Confirm program needs' },
      TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Identify travel season' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Confirm store owner' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Review senior interest' },
    },
  };
}

export function createMockOrganization(input: { name: string; accountType: string; city?: string; state?: string; assignedRep?: string; assignedDirector?: string; territory?: TerritoryId }): Organization {
  const user = getStoredUser();
  const row = buildMockOrganization({
    id: `org-local-${Date.now()}`,
    name: input.name,
    city: input.city || 'TBD',
    state: input.state || 'MN',
    assignedRep: input.assignedRep || (user?.role === 'REP' ? user.name : 'Maya Cole'),
    assignedDirector: input.assignedDirector || 'Dana Holt',
    territory: input.territory || 'metro',
    priority: input.accountType === 'School' ? 'HIGH' : 'MEDIUM',
  });
  writeLocalOrganizations([row, ...readLocalOrganizations()]);
  return row;
}

export function importLeadRows(
  leads: NormalizedLead[],
) {
  const existing = getAllOrganizations();
  const existingKeys = new Set(existing.map((org) => `${org.name}|${org.state}`.toLowerCase()));
  const localRows = readLocalOrganizations();
  const imported: Organization[] = [];
  let invalid = 0;
  let duplicates = 0;

  leads.forEach((lead, index) => {
    const key = lead.duplicateKey || `${lead.organizationName}|${lead.state}`.toLowerCase();
    if (lead.validationErrors.length) {
      invalid += 1;
      return;
    }
    if (existingKeys.has(key)) {
      duplicates += 1;
      return;
    }

    existingKeys.add(key);
    imported.push(buildMockOrganization({
      id: `org-import-${Date.now()}-${index}`,
      name: lead.organizationName,
      city: lead.city,
      state: lead.state,
      assignedRep: 'Unassigned',
      assignedDirector: 'Unassigned',
      territory: lead.territory || 'metro',
      priority: lead.tufPriority.toLowerCase() === 'high' ? 'HIGH' : lead.tufPriority.toLowerCase() === 'low' ? 'LOW' : 'MEDIUM',
      nextAction: lead.primaryContactName ? `Call ${lead.primaryContactName}` : 'Call primary contact and confirm buying timeline',
    }));
  });

  writeLocalOrganizations([...imported, ...localRows]);
  return { created: imported.length, invalid, duplicates };
}

export function bulkUpdateOrganizations(
  ids: string[],
  patch: Partial<Pick<Organization, 'assignedRep' | 'assignedDirector' | 'territory' | 'coverageStatus'>>,
) {
  const idSet = new Set(ids);
  const patchedRows = getAllOrganizations()
    .filter((org) => idSet.has(org.id))
    .map((org) => ({ ...org, ...patch, lastActivity: new Date().toISOString().slice(0, 10) }));
  const untouchedLocalRows = readLocalOrganizations().filter((org) => !idSet.has(org.id));
  writeLocalOrganizations([...patchedRows, ...untouchedLocalRows]);
  return patchedRows.length;
}
