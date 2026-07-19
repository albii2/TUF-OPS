import type { CoverageStatus, Organization, TerritoryId } from '../data/mockSalesData';
import { apiClient } from './apiClient';
import type { Role } from '../types';

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

const ZONE_TO_TERRITORY: Record<string, TerritoryId> = {
  metro: 'metro', north: 'north', west: 'west', south: 'south',
  central: 'metro', east: 'metro', 'twin cities': 'metro', minneapolis: 'metro', 'st paul': 'metro',
  northeast: 'north', northwest: 'north',
  southwest: 'west', southeast: 'south',
};

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

export async function listOrganizations(params: OrganizationListParams = {}): Promise<Organization[]> {
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

export async function createOrganization(input: {
  name: string;
  accountType: string;
  city?: string;
  state?: string;
  assignedRep?: string;
  assignedDirector?: string;
  territory?: TerritoryId;
}): Promise<Organization> {
  return apiClient<Organization>('/organizations', {
    method: 'POST',
    body: {
      name: input.name,
      city: input.city || 'TBD',
      state: (input.state || 'MN').toUpperCase(),
      assignedRep: input.assignedRep || 'Unassigned',
      assignedDirector: input.assignedDirector || 'Unassigned',
      territory: input.territory || 'metro',
      priority: input.accountType === 'School' ? 'HIGH' : 'MEDIUM',
    },
  });
}

export async function updateOrganization(
  id: string,
  patch: Partial<{ assignedRep: string; assignedDirector: string; priority: Organization['priority']; leadTier: Organization['leadTier']; nextAction: string }>,
): Promise<Organization | null> {
  return apiClient<Organization>(`/organizations/${id}`, { method: 'PUT', body: patch });
}

export async function getOrganizationById(id: string): Promise<Organization | undefined> {
  return apiClient<Organization>(`/organizations/${id}`);
}

export async function deleteOrganization(id: string): Promise<boolean> {
  await apiClient(`/organizations/${id}`, { method: 'DELETE' });
  return true;
}

// Backward-compat stubs — these are no-ops since mock mode is removed
export function listUntouchedAccounts(): Organization[] { return []; }
export function listStaleAccounts(): Organization[] { return []; }
export function listAccountsNeedingAction(): Organization[] { return []; }
