import { getStoredUser } from '../auth';
import { organizations as seededOrganizations, type CoverageStatus, type Organization, type TerritoryId } from '../data/mockSalesData';
import type { NormalizedLead } from '../utils/leadImport';
import { normalizeAccountName } from '../utils/naming';
import { getStaleOrganizations } from './kpiUtils';
import tufLeadsCsvRaw from '../assets/tuf_mn_leads_final.csv?raw';
import { normalizeLeadRow, parseCsvText } from '../utils/leadImport';
import { canViewOrganization } from './roleScope';
import { apiClient } from './apiClient';
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

const LOCAL_ORGANIZATIONS_KEY = 'tuf_ops_mock_organizations_v1';
const VALID_TERRITORIES: TerritoryId[] = ['metro', 'north', 'west', 'south'];
const ZONE_TO_TERRITORY: Record<string, TerritoryId> = {
  metro: 'metro', north: 'north', west: 'west', south: 'south',
  central: 'metro', east: 'metro', 'twin cities': 'metro', minneapolis: 'metro', 'st paul': 'metro',
  northeast: 'north', northwest: 'north',
  southwest: 'west', southeast: 'south',
};
const PRIMEAU_DIRECTOR_NAME = 'Primeau Hill';
const PRIMEAU_DIRECTOR_TERRITORIES = new Set<TerritoryId>(['metro', 'north']);

function getLaunchDirectorForTerritory(territory?: TerritoryId | '') {
  return territory && PRIMEAU_DIRECTOR_TERRITORIES.has(territory) ? PRIMEAU_DIRECTOR_NAME : 'Unassigned';
}
let bootstrapInProgress = false;
let zoneReconciliationComplete = false;

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

function normalizeBundledLeadRows() {
  const rows = parseCsvText(tufLeadsCsvRaw);
  if (!rows.length) return [];
  const [header, ...body] = rows;
  const headerKeys = header.map((h) => h.trim().toLowerCase());
  return body.map((line) => {
    const raw = Object.fromEntries(headerKeys.map((key, idx) => [key, line[idx] ?? '']));
    return normalizeLeadRow(raw);
  });
}

function buildLeadContactPatch(lead: NormalizedLead): Partial<Organization> {
  return {
    schoolPhone: lead.phone,
    athleticDirectorName: lead.athleticDirectorName || lead.primaryContactName,
    athleticDirectorEmail: lead.athleticDirectorEmail || lead.primaryContactEmail,
    athleticDirectorPhone: lead.athleticDirectorPhone || lead.primaryContactPhone,
    headCoachName: lead.headCoachName,
    headCoachEmail: lead.headCoachEmail,
    headCoachPhone: lead.headCoachPhone,
  };
}

function patchMissingLeadContactFields(org: Organization, lead: NormalizedLead): Organization {
  const contactPatch = buildLeadContactPatch(lead);
  return {
    ...org,
    schoolPhone: org.schoolPhone || contactPatch.schoolPhone,
    athleticDirectorName: org.athleticDirectorName || contactPatch.athleticDirectorName,
    athleticDirectorEmail: org.athleticDirectorEmail || contactPatch.athleticDirectorEmail,
    athleticDirectorPhone: org.athleticDirectorPhone || contactPatch.athleticDirectorPhone,
    headCoachName: org.headCoachName || contactPatch.headCoachName,
    headCoachEmail: org.headCoachEmail || contactPatch.headCoachEmail,
    headCoachPhone: org.headCoachPhone || contactPatch.headCoachPhone,
  };
}

function reconcileStoredLeadData() {
  if (zoneReconciliationComplete) return;
  const existing = readLocalOrganizations();
  if (!existing.length) {
    zoneReconciliationComplete = true;
    return;
  }
  const enrichedLeads = normalizeBundledLeadRows().filter((lead) => lead.territory || lead.phone || lead.athleticDirectorEmail || lead.athleticDirectorPhone || lead.headCoachEmail || lead.headCoachPhone || lead.assignedRepName);
  const leadsByKey = new Map(enrichedLeads.map((lead) => [lead.duplicateKey, lead]));
  const leadsByName = new Map(enrichedLeads.map((lead) => [normalizeAccountName(lead.organizationName).toLowerCase(), lead]));
  if (!leadsByKey.size && !leadsByName.size) {
    zoneReconciliationComplete = true;
    return;
  }

  let changed = false;
  const patched = existing.map((org) => {
    const normalizedName = normalizeAccountName(org.name).toLowerCase();
    const lead = leadsByKey.get(`${normalizedName}|${org.state}`.toLowerCase()) ?? leadsByName.get(normalizedName);
    if (!lead) return org;

    const patchedOrg = patchMissingLeadContactFields(org, lead);
    const territory = lead.territory as TerritoryId;
    const shouldPatchTerritory = territory && !VALID_TERRITORIES.includes(org.territory);
    const withTerritory = shouldPatchTerritory ? { ...patchedOrg, territory } : patchedOrg;
    const launchDirector = getLaunchDirectorForTerritory(withTerritory.territory);
    const withDirector = launchDirector !== 'Unassigned' && withTerritory.assignedDirector !== launchDirector
      ? { ...withTerritory, assignedDirector: launchDirector }
      : withTerritory;

    // Reconcile rep assignment from CSV — if the org is still 'Unassigned' but the CSV has a real rep name
    const csvRepName = resolveRepName(lead.assignedRepName || '');
    const withRep = csvRepName !== 'Unassigned' && (withDirector.assignedRep === 'Unassigned' || !withDirector.assignedRep)
      ? { ...withDirector, assignedRep: csvRepName }
      : withDirector;

    if (withRep === org || JSON.stringify(withRep) === JSON.stringify(org)) return org;
    changed = true;
    return withRep;
  });

  if (changed) writeLocalOrganizations(patched);
  zoneReconciliationComplete = true;
}

function bootstrapOrganizationsFromLeadsCsvIfEmpty() {
  if (import.meta.env.VITE_ENABLE_LEAD_BOOTSTRAP === 'false') return;
  if (bootstrapInProgress) return;
  const existing = readLocalOrganizations();
  if (existing.length) return;
  bootstrapInProgress = true;
  const normalizedLeads = normalizeBundledLeadRows();
  if (!normalizedLeads.length) {
    bootstrapInProgress = false;
    return;
  }
  importLeadRows(normalizedLeads);
  bootstrapInProgress = false;
}

function getAllOrganizations() {
  bootstrapOrganizationsFromLeadsCsvIfEmpty();
  reconcileStoredLeadData();
  const localRows = readLocalOrganizations();
  const localIds = new Set(localRows.map((row) => row.id));
  return [...localRows, ...seededOrganizations.filter((row) => !localIds.has(row.id))];
}

function getRoleScopedOrganizations() {
  const allOrganizations = getAllOrganizations();
  return allOrganizations.filter((org) => canViewOrganization(org));
}

export function listOrganizations(params: OrganizationListParams = {}): Organization[] {
  return getRoleScopedOrganizations().filter((org) => {
    const matchesSearch = !(params.search ?? '').trim() || [org.name, org.city, org.state, org.assignedRep, org.assignedDirector, org.schoolPhone, org.athleticDirectorName, org.athleticDirectorEmail, org.athleticDirectorPhone, org.headCoachName, org.headCoachEmail, org.headCoachPhone].join(' ').toLowerCase().includes((params.search ?? '').toLowerCase());
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
  schoolPhone?: string;
  athleticDirectorName?: string;
  athleticDirectorEmail?: string;
  athleticDirectorPhone?: string;
  headCoachName?: string;
  headCoachEmail?: string;
  headCoachPhone?: string;
}): Organization {
  return {
    id: input.id,
    name: normalizeAccountName(input.name),
    city: input.city,
    state: input.state.toUpperCase(),
    assignedRep: input.assignedRep,
    assignedDirector: input.assignedDirector,
    territory: input.territory,
    schoolPhone: input.schoolPhone,
    athleticDirectorName: input.athleticDirectorName,
    athleticDirectorEmail: input.athleticDirectorEmail,
    athleticDirectorPhone: input.athleticDirectorPhone,
    headCoachName: input.headCoachName,
    headCoachEmail: input.headCoachEmail,
    headCoachPhone: input.headCoachPhone,
    coverageStatus: 'UNTOUCHED',
    priority: input.priority ?? 'MEDIUM',
    pipelineValue: 0,
    status: 'NEW',
    nextAction: input.nextAction ?? 'Call primary contact and confirm sports coverage',
    lastActivity: new Date().toISOString().slice(0, 10),
    leadTier: input.leadTier ?? 'UNASSIGNED',
    expansionRecommendation: 'Start with Uniform discovery, then map Team Gear and Team Store potential by sport.',
    laneStatuses: {
      UNIFORM: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Confirm program needs' },
      TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Identify team gear needs' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Confirm store owner' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Review senior interest' },
    },
  };
}

export function updateOrganization(id: string, patch: Partial<{ assignedRep: string; assignedDirector: string; priority: Organization['priority']; leadTier: Organization['leadTier']; nextAction: string }>): Organization | null {
  const orgs = getAllOrganizations();
  const idx = orgs.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  orgs[idx] = { ...orgs[idx], ...patch };
  writeLocalOrganizations(orgs);
  return orgs[idx];
}

export function createMockOrganization(input: { name: string; accountType: string; city?: string; state?: string; assignedRep?: string; assignedDirector?: string; territory?: TerritoryId }): Organization {
  const user = getStoredUser();
  const assignedRep = user?.role === 'REP' ? user.name : input.assignedRep || 'Unassigned';
  const assignedDirector = user?.role === 'DIRECTOR' ? user.name : input.assignedDirector || 'Unassigned';
  const row = buildMockOrganization({
    id: `org-local-${Date.now()}`,
    name: input.name,
    city: input.city || 'TBD',
    state: input.state || 'MN',
    assignedRep,
    assignedDirector,
    territory: input.territory || 'metro',
    priority: input.accountType === 'School' ? 'HIGH' : 'MEDIUM',
  });
  writeLocalOrganizations([row, ...readLocalOrganizations()]);
  return row;
}

/** Pool / placeholder names in the CSV that mean "not yet assigned to a real rep" */
const UNASSIGNED_REP_PATTERNS = new Set([
  'unassigned', 'unassigned rep pool', 'tbd', '', 'n/a',
]);
const UNASSIGNED_DIR_PATTERNS = new Set([
  'unassigned', 'owner/admin pool', 'tbd', '', 'n/a',
]);

function resolveRepName(csvValue: string): string {
  return UNASSIGNED_REP_PATTERNS.has(csvValue.toLowerCase().trim()) ? 'Unassigned' : csvValue.trim();
}
function resolveDirectorName(csvValue: string, territory?: TerritoryId | ''): string {
  if (!UNASSIGNED_DIR_PATTERNS.has(csvValue.toLowerCase().trim())) return csvValue.trim();
  return getLaunchDirectorForTerritory(territory as TerritoryId);
}

export function importLeadRows(
  leads: NormalizedLead[],
) {
  const existing = readLocalOrganizations();
  const existingKeys = new Set(existing.map((org) => `${org.name}|${org.state}`.toLowerCase()));
  const existingNames = new Set(existing.map((org) => normalizeAccountName(org.name).toLowerCase()));
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
    if (existingKeys.has(key) || existingNames.has(normalizeAccountName(lead.organizationName).toLowerCase())) {
      duplicates += 1;
      return;
    }

    existingKeys.add(key);
    existingNames.add(normalizeAccountName(lead.organizationName).toLowerCase());

    const repName = resolveRepName(lead.assignedRepName || '');
    const directorName = resolveDirectorName(lead.assignedDirectorName || '', lead.territory);

    imported.push(buildMockOrganization({
      id: `org-import-${Date.now()}-${index}`,
      name: lead.organizationName,
      city: lead.city,
      state: lead.state,
      assignedRep: repName,
      assignedDirector: directorName,
      territory: lead.territory as TerritoryId,
      schoolPhone: lead.phone,
      athleticDirectorName: lead.athleticDirectorName || lead.primaryContactName,
      athleticDirectorEmail: lead.athleticDirectorEmail || lead.primaryContactEmail,
      athleticDirectorPhone: lead.athleticDirectorPhone || lead.primaryContactPhone,
      headCoachName: lead.headCoachName,
      headCoachEmail: lead.headCoachEmail,
      headCoachPhone: lead.headCoachPhone,
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
  const user = getStoredUser();
  if (user?.role !== 'ADMIN') throw new Error('Only Owner/Admin users can bulk update organizations.');
  const idSet = new Set(ids);
  const patchedRows = getAllOrganizations()
    .filter((org) => idSet.has(org.id))
    .map((org) => ({ ...org, ...patch, lastActivity: new Date().toISOString().slice(0, 10) }));
  const untouchedLocalRows = readLocalOrganizations().filter((org) => !idSet.has(org.id));
  writeLocalOrganizations([...patchedRows, ...untouchedLocalRows]);
  return patchedRows.length;
}

// ============================================================================
// ASYNC API WRAPPERS — use these when DATA_MODE === 'api'
// Never modify existing sync function signatures; add async variants instead.
// ============================================================================

function normalizeApiOrganization(raw: any): Organization {
  const zone = raw.tuf_zone || raw.territory || '';
  const territory: TerritoryId = ZONE_TO_TERRITORY[zone] || 'metro';
  const rawPriority = (raw.tuf_priority || '').toUpperCase();
  return {
    id: String(raw.id),
    name: raw.name || '',
    city: raw.city || '',
    state: raw.state || '',
    assignedRep: raw.assigned_rep_name || 'Unassigned',
    assignedDirector: raw.assigned_director_name || 'Unassigned',
    territory,
    schoolPhone: raw.school_phone || undefined,
    athleticDirectorName: undefined,
    athleticDirectorEmail: undefined,
    athleticDirectorPhone: undefined,
    headCoachName: undefined,
    headCoachEmail: undefined,
    headCoachPhone: undefined,
    coverageStatus: 'UNTOUCHED' as CoverageStatus,
    priority: rawPriority === 'TIER_1' ? 'HIGH' : rawPriority === 'TIER_3' ? 'LOW' : 'MEDIUM',
    pipelineValue: 0,
    status: 'NEW' as Organization['status'],
    nextAction: 'Call primary contact and confirm sports coverage',
    lastActivity: raw.updated_at ? raw.updated_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
    leadTier: rawPriority === 'TIER_1' ? 'TIER_1' : rawPriority === 'TIER_2' ? 'TIER_2' : rawPriority === 'TIER_3' ? 'TIER_3' : 'UNASSIGNED',
    laneStatuses: {
      UNIFORM: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Confirm program needs' },
      TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Identify team gear needs' },
      TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Confirm store owner' },
      LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Review senior interest' },
    },
    expansionRecommendation: 'Start with Uniform discovery, then map Team Gear and Team Store potential by sport.',
  };
}

export async function listOrganizationsAsync(params: OrganizationListParams = {}): Promise<Organization[]> {
  if (DATA_MODE === 'api') {
    const query: Record<string, string | undefined> = {};
    if (params.search) query.search = params.search;
    if (params.status && params.status !== 'ALL') query.status = params.status;
    if (params.rep) query.rep = params.rep;
    if (params.territory && params.territory !== 'ALL') query.territory = params.territory;
    if (params.director && params.director !== 'ALL') query.director = params.director;
    if (params.coverageStatus && params.coverageStatus !== 'ALL') query.coverageStatus = params.coverageStatus;
    if (params.priority && params.priority !== 'ALL') query.priority = params.priority;
    const raw = await apiClient<any[]>('/organizations', { query });
    return (raw || []).filter(Boolean).map(normalizeApiOrganization);
  }
  return listOrganizations(params);
}

export async function createOrganizationAsync(input: {
  name: string;
  accountType: string;
  city?: string;
  state?: string;
  assignedRep?: string;
  assignedDirector?: string;
  territory?: TerritoryId;
}): Promise<Organization> {
  if (DATA_MODE === 'api') {
    const user = getStoredUser();
    const numericUserId = user?.id && /^\d+$/.test(user.id) ? Number(user.id) : undefined;
    const assignedRep = user?.role === 'REP' ? user.name : input.assignedRep || 'Unassigned';
    const assignedDirector = user?.role === 'DIRECTOR' ? user.name : input.assignedDirector || 'Unassigned';
    return apiClient<Organization>('/organizations', {
      method: 'POST',
      body: {
        name: normalizeAccountName(input.name),
        city: input.city || 'TBD',
        state: (input.state || 'MN').toUpperCase(),
        assignedRep,
        assignedDirector,
        territory: input.territory || 'metro',
        priority: input.accountType === 'School' ? 'HIGH' : 'MEDIUM',
        created_by: numericUserId,
        updated_by: numericUserId,
      },
    });
  }
  return createMockOrganization(input);
}

export async function updateOrganizationAsync(
  id: string,
  patch: Partial<{ assignedRep: string; assignedDirector: string; priority: Organization['priority']; leadTier: Organization['leadTier']; nextAction: string }>,
): Promise<Organization | null> {
  if (DATA_MODE === 'api') {
    return apiClient<Organization>(`/organizations/${id}`, { method: 'PUT', body: patch });
  }
  return updateOrganization(id, patch);
}

export async function getOrganizationByIdAsync(id: string): Promise<Organization | undefined> {
  if (DATA_MODE === 'api') {
    return apiClient<Organization>(`/organizations/${id}`);
  }
  return getOrganizationById(id);
}
