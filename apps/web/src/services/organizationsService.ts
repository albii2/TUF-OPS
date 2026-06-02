import { getStoredUser } from '../auth';
import { type CoverageStatus, type Organization, type TerritoryId } from '../data/mockSalesData';
import type { NormalizedLead } from '../utils/leadImport';
import { normalizeAccountName } from '../utils/naming';
import { getStaleOrganizations } from './kpiUtils';
import tufLeadsCsvRaw from '../assets/tuf_leads_enriched - tuf_leads_enriched.csv?raw';
import { normalizeLeadRow, parseCsvText } from '../utils/leadImport';
import { listUsers } from './usersService';

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

const LOCAL_ORGANIZATIONS_KEY = 'tuf_ops_mock_organizations_v1';
let bootstrapInProgress = false;

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

function bootstrapOrganizationsFromLeadsCsvIfEmpty() {
  if (bootstrapInProgress) return;
  const existing = readLocalOrganizations();
  if (existing.length) return;
  bootstrapInProgress = true;
  const rows = parseCsvText(tufLeadsCsvRaw);
  if (!rows.length) {
    bootstrapInProgress = false;
    return;
  }
  const [header, ...body] = rows;
  const headerKeys = header.map((h) => h.trim());
  const normalizedLeads = body
    .map((line) => {
      const raw = Object.fromEntries(headerKeys.map((key, idx) => [key.toLowerCase(), line[idx] ?? '']));
      return normalizeLeadRow(raw);
    });
  importLeadRows(normalizedLeads);
  bootstrapInProgress = false;
}

function getAllOrganizations() {
  bootstrapOrganizationsFromLeadsCsvIfEmpty();
  return readLocalOrganizations();
}

function getRoleScopedOrganizations() {
  const user = getStoredUser();
  const allOrganizations = getAllOrganizations();
  if (!user || user.role === 'OWNER' || user.role === 'OPS') return allOrganizations;

  if (user.role === 'DIRECTOR') {
    const directorProfile = listUsers().find((m) => m.displayName === user.name && m.role === 'DIRECTOR');
    const zoneSet = new Set(directorProfile?.territory ? [directorProfile.territory] : []);
    return allOrganizations.filter((org) => org.assignedDirector === user.name || zoneSet.has(org.territory) || org.assignedDirector === 'Unassigned' || !org.territory);
  }

  if (user.role === 'REP') return allOrganizations.filter((org) => org.assignedRep === user.name);
  return allOrganizations;
}

export function listOrganizations(params: OrganizationListParams = {}): Organization[] {
  return getRoleScopedOrganizations().filter((org) => {
    const matchesSearch = !(params.search ?? '').trim() || [org.name, org.city, org.state, org.assignedRep, org.assignedDirector].join(' ').toLowerCase().includes((params.search ?? '').toLowerCase());
    const matchesStatus = !params.status || params.status === 'ALL' || org.status === params.status;
    const matchesRep = !params.rep || params.rep === 'ALL' || org.assignedRep === params.rep;
    const matchesTerritory = params.territory === undefined || params.territory === 'ALL' || org.territory === params.territory;
    const matchesDirector = !params.director || params.director === 'ALL' || org.assignedDirector === params.director;
    const matchesCoverage = !params.coverageStatus || params.coverageStatus === 'ALL' || org.coverageStatus === params.coverageStatus;
    const matchesPriority = !params.priority || params.priority === 'ALL' || org.priority === params.priority;
    return matchesSearch && matchesStatus && matchesRep && matchesTerritory && matchesDirector && matchesCoverage && matchesPriority;
  });
}

export function getOrganizationById(id: string): Organization | undefined {
  return getRoleScopedOrganizations().find((org) => org.id === id);
}

export function listUntouchedAccounts() {
  return listOrganizations({}).filter((o) => o.coverageStatus === 'UNTOUCHED');
}

export function listStaleAccounts() {
  return getStaleOrganizations(listOrganizations({}), 14);
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
  leadTier?: Organization['leadTier'];
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
    leadTier: input.leadTier ?? 'UNASSIGNED',
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
    assignedRep: input.assignedRep || (user?.role === 'REP' ? user.name : 'Unassigned'),
    assignedDirector: input.assignedDirector || 'Unassigned',
    territory: input.territory || 'metro',
    priority: input.accountType === 'School' ? 'HIGH' : 'MEDIUM',
  });
  writeLocalOrganizations([row, ...readLocalOrganizations()]);
  return row;
}

export function importLeadRows(
  leads: NormalizedLead[],
) {
  const existing = readLocalOrganizations();
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
      territory: (lead.territory || '') as TerritoryId,
      priority: lead.tufPriority.toLowerCase() === 'high' ? 'HIGH' : lead.tufPriority.toLowerCase() === 'low' ? 'LOW' : 'MEDIUM',
      leadTier:
        lead.tufPriority.toLowerCase() === 'tier 1' || lead.tufPriority.toLowerCase() === 'tier1'
          ? 'TIER_1'
          : lead.tufPriority.toLowerCase() === 'tier 2' || lead.tufPriority.toLowerCase() === 'tier2'
            ? 'TIER_2'
            : lead.tufPriority.toLowerCase() === 'tier 3' || lead.tufPriority.toLowerCase() === 'tier3'
              ? 'TIER_3'
              : 'UNASSIGNED',
      nextAction: lead.primaryContactName ? `Call ${lead.primaryContactName}` : 'Call primary contact and confirm buying timeline',
    }));
  });

  writeLocalOrganizations([...imported, ...localRows]);
  return { created: imported.length, invalid, duplicates, importedIds: imported.map((row) => row.id) };
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
