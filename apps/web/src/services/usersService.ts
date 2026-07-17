import type { AppUser, Role } from '../types';
import type { TerritoryId } from '../data/mockSalesData';
import { apiClient } from './apiClient';
import { getApiBaseUrl } from './apiBaseUrl';

const TRAINING_API_BASE_URL = `${getApiBaseUrl()}/training`;

export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type ManagedUser = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  role: Role;
  rank?: string | null;
  tier?: string | null;
  region?: string | null;
  state_market?: string | null;
  division?: string | null;
  territory: string;
  subterritory?: string | null;
  sport_focus?: string | null;
  assignedDirectorId?: string;
  reports_to_user_id?: string | null;
  status: UserStatus;
  avatarColor: string;
  mustChangeCredential: boolean;
  lastLoginAt?: string;
  lastCredentialAttemptAt?: string;
  lastActivityAt?: string;
  loginCount?: number;
  failedCredentialAttempts?: number;
  lockedUntil?: string | null;
  hrDocsCompleted?: boolean;
  directorSignedOff?: boolean;
  practicalExerciseCompleted?: boolean;
  isCertified?: boolean;
};

export type CredentialAuditAction = 'USER_CREATED' | 'TEMPORARY_CREDENTIAL_GENERATED' | 'CREDENTIAL_RESET' | 'CREDENTIAL_CHANGED' | 'FAILED_CREDENTIAL_ATTEMPT' | 'SUCCESSFUL_LOGIN';
export type CredentialAuditEntry = { id: string; action: CredentialAuditAction; targetUserId?: string; actorUserId?: string; createdAt: string; metadata: Record<string, unknown> };

const COLORS = ['#1FB6FF', '#22C55E', '#F59E0B', '#A855F7', '#EF4444', '#14B8A6'];

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

// ============================================================================
// USER LIST — API-backed
// ============================================================================

let cachedUsers: ManagedUser[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 30_000;

function normalizeApiUser(raw: any): ManagedUser {
  return {
    id: String(raw.id),
    firstName: raw.first_name || raw.firstName || '',
    lastName: raw.last_name || raw.lastName || '',
    displayName: raw.display_name || raw.name || `${raw.first_name || ''} ${raw.last_name || ''}`.trim(),
    email: raw.email || '',
    role: (raw.role === 'OWNER' ? 'ADMIN' : raw.role === 'OPS' ? 'OPERATIONS' : raw.role) as Role,
    rank: raw.rank || null,
    tier: raw.tier || null,
    region: raw.region || null,
    state_market: raw.state_market || null,
    division: raw.division || null,
    territory: raw.territory || '',
    subterritory: raw.subterritory || null,
    sport_focus: raw.sport_focus || null,
    assignedDirectorId: raw.assigned_director_id ? String(raw.assigned_director_id) : undefined,
    reports_to_user_id: raw.reports_to_user_id ? String(raw.reports_to_user_id) : null,
    status: raw.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    avatarColor: COLORS[Number(raw.id) % COLORS.length],
    mustChangeCredential: Boolean(raw.must_change_credential),
    hrDocsCompleted: Boolean(raw.hr_docs_completed),
    directorSignedOff: Boolean(raw.director_signed_off),
    practicalExerciseCompleted: Boolean(raw.practical_exercise_completed),
    isCertified: Boolean(raw.is_certified),
  };
}

async function fetchUsersFromApi(): Promise<ManagedUser[]> {
  try {
    const raw = await apiClient<any>('/users');
    const list = Array.isArray(raw) ? raw : (raw?.users || []);
    return list.map(normalizeApiUser);
  } catch {
    console.warn('[usersService] Failed to fetch users from API');
    return [];
  }
}

export async function listUsersAsync(): Promise<ManagedUser[]> {
  const now = Date.now();
  if (cachedUsers && now < cacheExpiry) return cachedUsers;
  cachedUsers = await fetchUsersFromApi();
  cacheExpiry = now + CACHE_TTL_MS;
  return cachedUsers;
}

// Sync wrapper for components that can't easily become async
let syncUserCache: ManagedUser[] = [];
let syncCacheLoading = false;

export function listUsers(): ManagedUser[] {
  if (!syncCacheLoading && syncUserCache.length === 0) {
    syncCacheLoading = true;
    listUsersAsync().then((users) => {
      syncUserCache = users;
      syncCacheLoading = false;
    }).catch(() => {
      syncCacheLoading = false;
    });
  }
  return syncUserCache;
}

// ============================================================================
// AUTHENTICATION — API only
// ============================================================================

export async function authenticateWithPin(pin: string): Promise<AppUser | null> {
  try {
    const result = await apiClient<{ user: Record<string, unknown>; token: string }>('/auth/login', {
      method: 'POST',
      body: { credential: pin },
    });
    const backendUser = result.user;
    const appUser: AppUser = {
      id: String(backendUser.id),
      name: String(backendUser.name || ''),
      email: String(backendUser.email || ''),
      role: (backendUser.role === 'OWNER' ? 'ADMIN' : backendUser.role === 'OPS' ? 'OPERATIONS' : String(backendUser.role)) as AppUser['role'],
      rank: (backendUser.rank || null) as string | null,
      tier: (backendUser.tier || null) as string | null,
      region: (backendUser.region || null) as string | null,
      state_market: (backendUser.state_market || null) as string | null,
      division: (backendUser.division || null) as string | null,
      territory: (backendUser.territory || null) as string | null,
      subterritory: (backendUser.subterritory || null) as string | null,
      sport_focus: (backendUser.sport_focus || null) as string | null,
      assigned_director_id: typeof backendUser.assigned_director_id === 'number' ? backendUser.assigned_director_id : null,
      reports_to_user_id: typeof backendUser.reports_to_user_id === 'number' ? backendUser.reports_to_user_id : null,
      mustChangeCredential: Boolean(backendUser.must_change_credential),
      hrDocsCompleted: Boolean(backendUser.hr_docs_completed),
      directorSignedOff: Boolean(backendUser.director_signed_off),
      practicalExerciseCompleted: Boolean(backendUser.practical_exercise_completed),
      isCertified: Boolean(backendUser.is_certified),
    };
    (appUser as any).token = result.token;
    return appUser;
  } catch {
    console.error('[auth] Backend login failed');
    return null;
  }
}

// Stub — credential-based auth is not supported in API mode
export async function authenticateWithCredential(_emailOrName: string, _credential: string): Promise<AppUser | null> {
  return null;
}

// ============================================================================
// ROLE / TERRITORY HELPERS
// ============================================================================

export function getActiveUserByRole(role: Role): ManagedUser | undefined {
  return syncUserCache.find((u) => u.role === role && u.status === 'ACTIVE');
}

export function getManagedRepNamesForDirector(directorName: string): string[] {
  const users = syncUserCache;
  const director = users.find((u) => u.displayName === directorName && u.role === 'DIRECTOR');
  if (!director) return [];
  return users
    .filter((u) => u.role === 'REP' && u.status === 'ACTIVE' && u.assignedDirectorId === director.id)
    .map((u) => u.displayName);
}

export function getManagedTerritoriesForDirector(directorName: string): TerritoryId[] {
  const users = syncUserCache;
  const director = users.find((u) => u.displayName === directorName && u.role === 'DIRECTOR');
  if (!director?.territory) return [];
  return director.territory
    .split(/[\\/,]/)
    .map((territory) => territory.trim().toLowerCase())
    .filter((territory): territory is TerritoryId => ['metro', 'north', 'west', 'south'].includes(territory));
}

// ============================================================================
// TRAINING TOGGLES — API only
// ============================================================================

export async function toggleUserHrDocs(id: string, hrDocsCompleted: boolean) {
  const response = await fetch(`${TRAINING_API_BASE_URL}/reps/${id}/hr-docs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hrDocsCompleted }),
  });
  if (!response.ok) {
    throw new Error(`Failed to toggle HR docs: ${response.status}`);
  }
}

export async function toggleUserPracticalExercise(id: string, practicalExerciseCompleted: boolean) {
  const response = await fetch(`${TRAINING_API_BASE_URL}/reps/${id}/practical-exercise`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ practicalExerciseCompleted }),
  });
  if (!response.ok) {
    throw new Error(`Failed to toggle practical exercise: ${response.status}`);
  }
}

export async function toggleUserDirectorSignoff(id: string, directorSignedOff: boolean) {
  const response = await fetch(`${TRAINING_API_BASE_URL}/reps/${id}/director-signoff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ directorSignedOff }),
  });
  if (!response.ok) {
    throw new Error(`Failed to toggle director signoff: ${response.status}`);
  }
}

// ============================================================================
// STUBS — wired to API above, kept for reference
// ============================================================================

export async function createUser(
  input: { firstName: string; lastName: string; email: string; role: string; territory?: string; assignedDirectorId?: string; status?: string },
  _actor?: AppUser | null,
): Promise<{ user: ManagedUser; temporaryCredential: string }> {
  const payload: Record<string, unknown> = {
    name: `${input.firstName} ${input.lastName}`.trim(),
    role: input.role,
  };
  if (input.email) payload.email = input.email;
  if (input.territory) payload.territory = input.territory;
  if (input.assignedDirectorId) payload.assigned_director_id = Number(input.assignedDirectorId);
  if (input.status) payload.status = input.status;

  const result = await apiClient<{ user: Record<string, unknown>; temporaryCredential: string }>('/users', {
    method: 'POST',
    body: payload,
  });
  return { user: normalizeApiUser(result.user), temporaryCredential: result.temporaryCredential };
}

export async function updateUser(id: string, patch: any, _actor?: AppUser | null) {
  return apiClient(`/users/${id}`, {
    method: 'PUT',
    body: patch,
  });
}

export async function resetUserCredential(id: string, _actor?: AppUser | null): Promise<{ user: ManagedUser; temporaryCredential: string }> {
  const result = await apiClient<{ user: Record<string, unknown>; temporaryCredential: string }>(`/users/${id}/reset-credential`, {
    method: 'POST',
  });
  return { user: normalizeApiUser(result.user), temporaryCredential: result.temporaryCredential };
}

export async function changeOwnCredential(userId: string, currentCredential: string, newCredential: string): Promise<{ mustChangeCredential: boolean }> {
  const result = await apiClient<{ user: { must_change_credential: boolean } }>('/users/me/change-credential', {
    method: 'POST',
    body: { current_credential: currentCredential, new_credential: newCredential },
  });
  return { mustChangeCredential: result.user.must_change_credential };
}

export function generateTemporaryCredential() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// ============================================================================
// FORMAT HELPERS
// ============================================================================

export function avatarInitials(displayName: string) { return initials(displayName); }

export function formatUserDisplay(user: ManagedUser | AppUser): string {
  if (user.role === 'ADMIN') {
    return `Admin · ${user.region || 'National'}`;
  }
  if (user.role === 'REGIONAL_DIRECTOR') {
    return `Regional Director · ${user.region || 'Midwest'}`;
  }
  if (user.role === 'DIRECTOR') {
    const parts = ['Director'];
    if (user.state_market) {
      if (user.division) {
        parts.push(`${user.state_market} ${user.division}`);
      } else {
        parts.push(user.state_market);
      }
    }
    if (user.subterritory) parts.push(user.subterritory);
    return parts.join(' · ');
  }
  if (user.role === 'OPERATIONS') {
    return `Operations · ${user.region || 'National'}`;
  }
  // REP:
  const parts = ['Rep'];
  if (user.state_market) {
    if (user.division) {
      parts.push(`${user.state_market} ${user.division}`);
    } else {
      parts.push(user.state_market);
    }
  }
  const territoryPart = user.subterritory || user.territory;
  if (territoryPart) parts.push(territoryPart);
  return parts.join(' · ');
}

export function seedBaselineUsers() {
  // No-op in API mode
}
