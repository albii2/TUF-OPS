import type { AppUser, Role } from '../types';
import type { TerritoryId } from '../data/mockSalesData';
import { DATA_MODE } from './dataMode';
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

type StoredManagedUser = ManagedUser & {
  credentialHash: string;
  credentialSalt: string;
  failedCredentialAttempts?: number;
  lockedUntil?: string | null;
};

export type CredentialAuditAction = 'USER_CREATED' | 'TEMPORARY_CREDENTIAL_GENERATED' | 'CREDENTIAL_RESET' | 'CREDENTIAL_CHANGED' | 'FAILED_CREDENTIAL_ATTEMPT' | 'SUCCESSFUL_LOGIN';
export type CredentialAuditEntry = { id: string; action: CredentialAuditAction; targetUserId?: string; actorUserId?: string; createdAt: string; metadata: Record<string, unknown> };

const KEY = 'tuf_ops_users_v7';
const LEGACY_USER_KEYS = ['tuf_ops_users_v1', 'tuf_ops_users_v2', 'tuf_ops_users_v3', 'tuf_ops_users_v4', 'tuf_ops_users_v5', 'tuf_ops_users_v6'];
const AUDIT_KEY = 'tuf_ops_credential_audit_v1';
const COLORS = ['#1FB6FF', '#22C55E', '#F59E0B', '#A855F7', '#EF4444', '#14B8A6'];
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const seedRows: StoredManagedUser[] = [
  {
    id: 'u-owner-coach-bradshaw',
    firstName: 'A Bradshaw',
    lastName: 'VP',
    displayName: 'A Bradshaw VP',
    email: 'owner@tuf.local',
    role: 'ADMIN',
    rank: 'Admin',
    region: 'National',
    division: 'All',
    territory: 'National',
    subterritory: 'All',
    sport_focus: 'All',
    status: 'ACTIVE',
    avatarColor: COLORS[0],
    mustChangeCredential: false,
    failedCredentialAttempts: 0,
    lockedUntil: null,
    loginCount: 0,
    hrDocsCompleted: true,
    directorSignedOff: true,
    isCertified: true,
    credentialSalt: 'seed-owner',
    credentialHash: '65ab4c8d753725601c51da06f3a2ca1752466b7719f9ec8ffb4cc518b8eaf962',
  },
  {
    id: 'u-director-primeau-hill',
    firstName: 'Primeau',
    lastName: 'Hill',
    displayName: 'Primeau Hill',
    email: 'primeau.hill@tufsports.us',
    role: 'DIRECTOR',
    rank: 'Director',
    region: 'Midwest',
    state_market: 'MN',
    division: 'General',
    territory: 'Minnesota',
    subterritory: 'Metro + North',
    sport_focus: 'All',
    status: 'ACTIVE',
    avatarColor: COLORS[1],
    mustChangeCredential: false,
    failedCredentialAttempts: 0,
    lockedUntil: null,
    loginCount: 0,
    hrDocsCompleted: true,
    directorSignedOff: true,
    isCertified: true,
    credentialSalt: 'seed-primeau',
    credentialHash: '00399ec96c4d81818f40f802315d89ad77c3e37cf3f46681eff3a77a0e661601',
  },
  {
    id: 'u-director-william-menzel',
    firstName: 'William',
    lastName: 'Menzel',
    displayName: 'William Menzel',
    email: 'william.menzel@tufsports.us',
    role: 'DIRECTOR',
    rank: 'Director',
    region: 'Midwest',
    state_market: 'MN',
    division: 'General',
    territory: 'Minnesota',
    subterritory: 'South + West',
    sport_focus: 'All',
    status: 'ACTIVE',
    avatarColor: COLORS[4],
    mustChangeCredential: false,
    failedCredentialAttempts: 0,
    lockedUntil: null,
    loginCount: 0,
    hrDocsCompleted: true,
    directorSignedOff: true,
    isCertified: true,
    credentialSalt: 'seed-william',
    credentialHash: 'PLACEHOLDER',
  },
  {
    id: 'u-rep-david-lundberg',
    firstName: 'David',
    lastName: 'Lundberg',
    displayName: 'David Lundberg',
    email: 'lundbergdave18@gmail.com',
    role: 'REP',
    rank: 'TAE',
    tier: 'TAE',
    region: 'Midwest',
    state_market: 'MN',
    division: 'General',
    territory: 'Minnesota',
    subterritory: 'Bloomington / Richfield / Minnetonka',
    sport_focus: 'All',
    assignedDirectorId: 'u-director-primeau-hill',
    status: 'ACTIVE',
    avatarColor: COLORS[3],
    mustChangeCredential: false,
    failedCredentialAttempts: 0,
    lockedUntil: null,
    loginCount: 0,
    hrDocsCompleted: false,
    directorSignedOff: false,
    isCertified: false,
    credentialSalt: 'seed-david',
    credentialHash: 'c60074e2660742b8e9442c489fed80d4dcd3adc0087375eed1ac736654729d66',
  },
  {
    id: 'u-rep-josh-hoffman',
    firstName: 'Josh',
    lastName: 'Hoffman',
    displayName: 'Josh Hoffman',
    email: 'jhoffman@kipsu.com',
    role: 'REP',
    rank: 'TAE',
    tier: 'TAE',
    region: 'Midwest',
    state_market: 'MN',
    division: 'General',
    territory: 'Minnesota',
    subterritory: 'Minneapolis / St. Paul Metro',
    sport_focus: 'All',
    assignedDirectorId: 'u-director-primeau-hill',
    status: 'ACTIVE',
    avatarColor: COLORS[5],
    mustChangeCredential: false,
    failedCredentialAttempts: 0,
    lockedUntil: null,
    loginCount: 0,
    hrDocsCompleted: false,
    directorSignedOff: true,
    isCertified: true,
    credentialSalt: 'seed-josh',
    credentialHash: '5b8880ceb089c547b15bb8b1144dca8e2b4c09164e54e28325f1c7137415a5e2',
  },
];

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

function sanitize(row: StoredManagedUser): ManagedUser {
  const { credentialHash: _credentialHash, credentialSalt: _credentialSalt, ...safe } = row;
  return {
    ...safe,
    failedCredentialAttempts: safe.failedCredentialAttempts || 0,
    lockedUntil: safe.lockedUntil || null,
    loginCount: safe.loginCount || 0,
  };
}

export function saveStoredUsers(rows: StoredManagedUser[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

export function readStoredUsers(): StoredManagedUser[] {
  LEGACY_USER_KEYS.forEach((key) => localStorage.removeItem(key));
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    saveStoredUsers(seedRows);
    return seedRows;
  }
  try {
    const rows = JSON.parse(raw) as StoredManagedUser[];
    const seedIds = new Set(seedRows.map((row) => row.id));
    const seedNames = new Set(seedRows.map((row) => row.displayName));
    const migrated = rows.filter((row) => seedIds.has(row.id) || seedNames.has(row.displayName) || row.id.startsWith('u-local-'));
    const safeRows = migrated.map(({ pin: _pin, ...row }: any) => {
      const seedUser = seedRows.find((s) => s.id === row.id);
      if (seedUser) {
        return {
          ...row,
          ...seedUser, // Sync all latest seed details (including credentials, salt, hash, email, status)
          territory: seedUser.id === 'u-director-primeau-hill' ? 'metro,north' : seedUser.territory,
          // Preserve local progress/state fields
          hrDocsCompleted: row.hrDocsCompleted ?? seedUser.hrDocsCompleted,
          directorSignedOff: row.directorSignedOff ?? seedUser.directorSignedOff,
          practicalExerciseCompleted: row.practicalExerciseCompleted ?? seedUser.practicalExerciseCompleted,
          isCertified: row.isCertified ?? seedUser.isCertified,
          lastLoginAt: row.lastLoginAt,
          lastActivityAt: row.lastActivityAt,
          lastCredentialAttemptAt: row.lastCredentialAttemptAt,
          loginCount: row.loginCount,
          failedCredentialAttempts: row.failedCredentialAttempts,
          lockedUntil: row.lockedUntil,
        };
      }
      if (row.id === 'u-director-primeau-hill') return { ...row, territory: 'metro,north' };
      return row;
    }) as StoredManagedUser[];
    const mergedRows = [
      ...safeRows,
      ...seedRows.filter((seed) => !safeRows.some((row) => row.id === seed.id || row.displayName === seed.displayName)),
    ];
    if (migrated.some((row: any) => row.pin) || migrated.length !== rows.length || mergedRows.length !== rows.length || JSON.stringify(mergedRows) !== JSON.stringify(rows)) {
      saveStoredUsers(mergedRows);
      return mergedRows;
    }
    return rows;
  } catch {
    saveStoredUsers(seedRows);
    return seedRows;
  }
}

async function digest(input: string) {
  const bytes = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashCredential(credential: string, salt = crypto.getRandomValues(new Uint32Array(4)).join('-')) {
  return { salt, hash: await digest(`${salt}:${credential}`) };
}

function validateTemporaryCredential(credential: string) {
  if (!credential.trim()) throw new Error('Credential is required');
  if (!/^\d{4}$/.test(credential)) throw new Error('PIN must be exactly 4 numbers');
}

function validatePermanentCredential(credential: string) {
  validateTemporaryCredential(credential);
  if (new Set(['0000', '1111', '1234', '4321', '1212']).has(credential) || /^(\d)\1+$/.test(credential)) throw new Error('Choose a less obvious credential');
}

export function generateTemporaryCredential() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function audit(action: CredentialAuditAction, targetUserId?: string, actorUserId?: string, metadata: Record<string, unknown> = {}) {
  const scrubbed = Object.fromEntries(Object.entries(metadata).filter(([key]) => !key.toLowerCase().includes('credential') && !key.toLowerCase().includes('password') && !key.toLowerCase().includes('pin')));
  const rows = listCredentialAudit();
  localStorage.setItem(AUDIT_KEY, JSON.stringify([{ id: `audit-${Date.now()}`, action, targetUserId, actorUserId, createdAt: new Date().toISOString(), metadata: scrubbed }, ...rows]));
}

export function listCredentialAudit(): CredentialAuditEntry[] {
  try { return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]') as CredentialAuditEntry[]; } catch { return []; }
}

export function listUsers(): ManagedUser[] {
  return readStoredUsers().map(sanitize);
}

export function seedBaselineUsers(): ManagedUser[] {
  saveStoredUsers(seedRows);
  return seedRows.map(sanitize);
}

export async function createUser(input: Omit<ManagedUser, 'id' | 'displayName' | 'avatarColor' | 'mustChangeCredential'> & { temporaryCredential?: string }, actor?: AppUser | null) {
  if (actor?.role !== 'ADMIN') throw new Error('Only Owner/Admin users can create users');
  const rows = readStoredUsers();
  const displayName = `${input.firstName} ${input.lastName}`.trim();
  if (!displayName) throw new Error('Display name required');
  if (rows.some((u) => u.displayName.toLowerCase() === displayName.toLowerCase())) throw new Error('User with this name already exists');
  if (input.role === 'REP' && !input.assignedDirectorId) throw new Error('Reps must be assigned to a director');
  const temporaryCredential = input.temporaryCredential || generateTemporaryCredential();
  validateTemporaryCredential(temporaryCredential);
  const { salt, hash } = await hashCredential(temporaryCredential);
  const row: StoredManagedUser = {
    ...input,
    id: `u-local-${Date.now()}`,
    displayName,
    avatarColor: COLORS[rows.length % COLORS.length],
    mustChangeCredential: true,
    credentialSalt: salt,
    credentialHash: hash,
    failedCredentialAttempts: 0,
    lockedUntil: null,
    loginCount: 0,
  };
  saveStoredUsers([row, ...rows]);
  audit('USER_CREATED', row.id, actor?.id, { role: row.role });
  audit('TEMPORARY_CREDENTIAL_GENERATED', row.id, actor?.id, { reason: 'create_user' });
  return { user: sanitize(row), temporaryCredential };
}

export function updateUser(id: string, patch: Partial<ManagedUser>, actor?: AppUser | null) {
  if (actor?.role !== 'ADMIN') throw new Error('Only Owner/Admin users can update users');
  const users = readStoredUsers();
  const target = users.find((u) => u.id === id);
  if (!target) return;
  if (target.role === 'ADMIN' && patch.status === 'INACTIVE') throw new Error('Cannot archive the owner');
  const rows = users.map((u) => (u.id === id ? { ...u, ...patch, displayName: `${patch.firstName ?? u.firstName} ${patch.lastName ?? u.lastName}`.trim() } : u));
  saveStoredUsers(rows);
}

export async function resetUserCredential(id: string, actor?: AppUser | null) {
  if (actor?.role !== 'ADMIN') throw new Error('Only Owner/Admin users can reset credentials');
  const users = readStoredUsers();
  const target = users.find((u) => u.id === id);
  if (!target) throw new Error('User not found');
  const temporaryCredential = generateTemporaryCredential();
  const { salt, hash } = await hashCredential(temporaryCredential);
  const rows = users.map((u) => u.id === id ? { ...u, credentialSalt: salt, credentialHash: hash, mustChangeCredential: true, failedCredentialAttempts: 0, lockedUntil: null } : u);
  saveStoredUsers(rows);
  audit('CREDENTIAL_RESET', id, actor?.id, { reason: 'admin_reset' });
  audit('TEMPORARY_CREDENTIAL_GENERATED', id, actor?.id, { reason: 'reset' });
  return { user: sanitize(rows.find((u) => u.id === id)!), temporaryCredential };
}

export async function changeOwnCredential(userId: string, currentCredential: string, newCredential: string) {
  validatePermanentCredential(newCredential);
  const users = readStoredUsers();
  const target = users.find((u) => u.id === userId);
  if (!target) throw new Error('User not found');
  const currentHash = await digest(`${target.credentialSalt}:${currentCredential}`);
  if (currentHash !== target.credentialHash) {
    audit('FAILED_CREDENTIAL_ATTEMPT', userId, userId, { reason: 'change_credential' });
    throw new Error('Current credential is invalid');
  }
  const { salt, hash } = await hashCredential(newCredential);
  const rows = users.map((u) => u.id === userId ? { ...u, credentialSalt: salt, credentialHash: hash, mustChangeCredential: false, failedCredentialAttempts: 0, lockedUntil: null } : u);
  saveStoredUsers(rows.map((u) => u.id === userId ? { ...u, lastActivityAt: new Date().toISOString() } : u));
  audit('CREDENTIAL_CHANGED', userId, userId, {});
  return sanitize(rows.find((u) => u.id === userId)!);
}

export function getActiveUserByRole(role: Role): ManagedUser | undefined {
  return listUsers().find((u) => u.role === role && u.status === 'ACTIVE');
}

export function getManagedRepNamesForDirector(directorName: string): string[] {
  const users = listUsers();
  const director = users.find((u) => u.displayName === directorName && u.role === 'DIRECTOR');
  if (!director) return [];
  return users.filter((u) => u.role === 'REP' && u.status === 'ACTIVE' && u.assignedDirectorId === director.id).map((u) => u.displayName);
}

export function getManagedTerritoriesForDirector(directorName: string): TerritoryId[] {
  const users = listUsers();
  const director = users.find((u) => u.displayName === directorName && u.role === 'DIRECTOR');
  if (!director?.territory) return [];
  return director.territory
    .split(/[\/,]/)
    .map((territory) => territory.trim().toLowerCase())
    .filter((territory): territory is TerritoryId => ['metro', 'north', 'west', 'south'].includes(territory));
}

function toAppUser(user: StoredManagedUser): AppUser {
  return {
    id: user.id,
    name: user.displayName,
    email: user.email,
    role: user.role,
    rank: user.rank || null,
    tier: user.tier || null,
    region: user.region || null,
    state_market: user.state_market || null,
    division: user.division || null,
    territory: user.territory || null,
    subterritory: user.subterritory || null,
    sport_focus: user.sport_focus || null,
    assigned_director_id: user.assignedDirectorId ? Number(user.assignedDirectorId.replace(/\D/g, '')) || null : null,
    reports_to_user_id: user.reports_to_user_id ? Number(user.reports_to_user_id.replace(/\D/g, '')) || null : null,
    mustChangeCredential: user.mustChangeCredential,
    hrDocsCompleted: user.hrDocsCompleted,
    directorSignedOff: user.directorSignedOff,
    practicalExerciseCompleted: user.practicalExerciseCompleted,
    isCertified: user.isCertified
  };
}

export async function toggleUserHrDocs(id: string, hrDocsCompleted: boolean) {
  if (DATA_MODE === 'api') {
    const response = await fetch(`${TRAINING_API_BASE_URL}/reps/${id}/hr-docs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hrDocsCompleted }),
    });
    if (!response.ok) {
      throw new Error(`Failed to toggle HR docs: ${response.status}`);
    }
  }

  const users = readStoredUsers();
  const rows = users.map((u) => {
    if (u.id === id) {
      const isCertified = u.role !== 'REP' || (hrDocsCompleted && (u.practicalExerciseCompleted || false) && (u.directorSignedOff || false));
      return { ...u, hrDocsCompleted, isCertified };
    }
    return u;
  });
  saveStoredUsers(rows);

  const rawUser = localStorage.getItem('tuf_ops_user_v3');
  if (rawUser) {
    const current = JSON.parse(rawUser);
    if (current.id === id) {
      current.hrDocsCompleted = hrDocsCompleted;
      current.isCertified = hrDocsCompleted && (current.practicalExerciseCompleted || false) && (current.directorSignedOff || false);
      localStorage.setItem('tuf_ops_user_v3', JSON.stringify(current));
      window.dispatchEvent(new CustomEvent('tuf:user-updated', { detail: current }));
    }
  }
}


// export function toggleUserPracticalExercise
export async function toggleUserPracticalExercise(id: string, practicalExerciseCompleted: boolean) {
  if (DATA_MODE === 'api') {
    const rawUser = localStorage.getItem('tuf_ops_user_v3');
    const actorRole = rawUser ? JSON.parse(rawUser).role : undefined;
    const response = await fetch(`${TRAINING_API_BASE_URL}/reps/${id}/practical-exercise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ practicalExerciseCompleted, actorRole }),
    });
    if (!response.ok) {
      throw new Error(`Failed to toggle practical exercise: ${response.status}`);
    }
  }

  const users = readStoredUsers();
  const rows = users.map((u) => {
    if (u.id === id) {
      const isCertified = u.role !== 'REP' || ((u.hrDocsCompleted || false) && practicalExerciseCompleted && (u.directorSignedOff || false));
      return { ...u, practicalExerciseCompleted, isCertified };
    }
    return u;
  });
  saveStoredUsers(rows);

  const rawUser = localStorage.getItem('tuf_ops_user_v3');
  if (rawUser) {
    const current = JSON.parse(rawUser);
    if (current.id === id) {
      current.practicalExerciseCompleted = practicalExerciseCompleted;
      current.isCertified = (current.hrDocsCompleted || false) && practicalExerciseCompleted && (current.directorSignedOff || false);
      localStorage.setItem('tuf_ops_user_v3', JSON.stringify(current));
      window.dispatchEvent(new CustomEvent('tuf:user-updated', { detail: current }));
    }
  }
}

export async function toggleUserDirectorSignoff(id: string, directorSignedOff: boolean) {
  if (DATA_MODE === 'api') {
    const response = await fetch(`${TRAINING_API_BASE_URL}/reps/${id}/director-signoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ directorSignedOff }),
    });
    if (!response.ok) {
      throw new Error(`Failed to toggle director signoff: ${response.status}`);
    }
  }

  const users = readStoredUsers();
  const rows = users.map((u) => {
    if (u.id === id) {
      const isCertified = u.role !== 'REP' || ((u.hrDocsCompleted || false) && (u.practicalExerciseCompleted || false) && directorSignedOff);
      return { ...u, directorSignedOff, isCertified };
    }
    return u;
  });
  saveStoredUsers(rows);

  const rawUser = localStorage.getItem('tuf_ops_user_v3');
  if (rawUser) {
    const current = JSON.parse(rawUser);
    if (current.id === id) {
      current.directorSignedOff = directorSignedOff;
      current.isCertified = (current.hrDocsCompleted || false) && (current.practicalExerciseCompleted || false) && directorSignedOff;
      localStorage.setItem('tuf_ops_user_v3', JSON.stringify(current));
      window.dispatchEvent(new CustomEvent('tuf:user-updated', { detail: current }));
    }
  }
}

async function recordSuccessfulLogin(user: StoredManagedUser, users: StoredManagedUser[]) {
  const now = new Date().toISOString();
  saveStoredUsers(users.map((u) => u.id === user.id ? {
    ...u,
    failedCredentialAttempts: 0,
    lockedUntil: null,
    lastLoginAt: now,
    lastActivityAt: now,
    lastCredentialAttemptAt: now,
    loginCount: (u.loginCount || 0) + 1,
  } : u));
  audit('SUCCESSFUL_LOGIN', user.id, user.id, {});
}

export async function authenticateWithPin(pin: string): Promise<AppUser | null> {
  // In API mode, try backend login for a token; fall back to localStorage
  if (DATA_MODE === 'api') {
    const users = readStoredUsers();
    let localUser: StoredManagedUser | null = null;
    for (const u of users.filter((u) => u.status === 'ACTIVE')) {
      const hash = await digest(`${u.credentialSalt}:${pin}`);
      if (hash === u.credentialHash) { localUser = u; break; }
    }
    if (localUser) {
      try {
        const result = await apiClient<{ user: Record<string, unknown>; token: string }>('/auth/login', {
          method: 'POST',
          body: { email: localUser.email, credential: pin },
        });
        // Transform backend SafeUser (numeric id, snake_case) to frontend AppUser (string id, camelCase)
        const backendUser = result.user;
        const appUser: AppUser = {
          id: String(backendUser.id),
          name: String(backendUser.name ?? localUser.displayName ?? ''),
          email: String(backendUser.email ?? localUser.email ?? ''),
          role: (backendUser.role === 'OWNER' ? 'ADMIN' : String(backendUser.role ?? localUser.role)) as AppUser['role'],
          rank: (backendUser.rank ?? localUser.rank ?? null) as string | null,
          tier: (backendUser.tier ?? localUser.tier ?? null) as string | null,
          region: (backendUser.region ?? localUser.region ?? null) as string | null,
          state_market: (backendUser.state_market ?? localUser.state_market ?? null) as string | null,
          division: (backendUser.division ?? localUser.division ?? null) as string | null,
          territory: (backendUser.territory ?? localUser.territory ?? null) as string | null,
          subterritory: (backendUser.subterritory ?? localUser.subterritory ?? null) as string | null,
          sport_focus: (backendUser.sport_focus ?? localUser.sport_focus ?? null) as string | null,
          assigned_director_id: typeof backendUser.assigned_director_id === 'number' ? backendUser.assigned_director_id : null,
          reports_to_user_id: typeof backendUser.reports_to_user_id === 'number' ? backendUser.reports_to_user_id : null,
          mustChangeCredential: Boolean(backendUser.must_change_credential ?? localUser.mustChangeCredential),
          hrDocsCompleted: Boolean(backendUser.hr_docs_completed ?? localUser.hrDocsCompleted),
          directorSignedOff: Boolean(backendUser.director_signed_off ?? localUser.directorSignedOff),
          practicalExerciseCompleted: Boolean(backendUser.practical_exercise_completed ?? localUser.practicalExerciseCompleted),
          isCertified: Boolean(backendUser.is_certified ?? localUser.isCertified),
        };
        (appUser as any).token = result.token;
        return appUser;
      } catch (err: any) {
        console.error('[auth] Backend login FAILED — token NOT stored. Error:', err?.message || err);
        console.error('[auth] Check: is Railway reachable? Is AUTH_TOKEN_SECRET set?');
        // DO NOT fall through to localStorage-only path — returning a user without
        // a token leads to 401 on every API call (org create, opp create, etc.)
        // and a NaN user ID that causes 500s. Fail loudly so the user sees the problem.
        return null;
      }
    }
  }
  // v25000 — build marker: API auth active
  console.log('[auth] TUF Ops v25000 — API mode:', DATA_MODE);
  validateTemporaryCredential(pin);
  const users = readStoredUsers();
  const now = new Date().toISOString();
  for (const user of users.filter((u) => u.status === 'ACTIVE')) {
    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) continue;
    const pinHash = await digest(`${user.credentialSalt}:${pin}`);
    if (pinHash === user.credentialHash) {
      await recordSuccessfulLogin(user, users);
      return toAppUser(user);
    }
  }
  audit('FAILED_CREDENTIAL_ATTEMPT', undefined, undefined, { reason: 'pin_login' });
  saveStoredUsers(users.map((u) => ({ ...u, lastCredentialAttemptAt: now })));
  return null;
}



export async function authenticateWithCredential(emailOrName: string, credential: string): Promise<AppUser | null> {
  const users = readStoredUsers();
  const lookup = emailOrName.trim().toLowerCase();
  const user = users.find((u) => u.status === 'ACTIVE' && (u.email.toLowerCase() === lookup || u.displayName.toLowerCase() === lookup));
  const now = new Date().toISOString();
  if (!user) {
    audit('FAILED_CREDENTIAL_ATTEMPT', undefined, undefined, { login: lookup });
    return null;
  }
  if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
    audit('FAILED_CREDENTIAL_ATTEMPT', user.id, undefined, { reason: 'locked' });
    return null;
  }
  const credentialHash = await digest(`${user.credentialSalt}:${credential}`);
  if (credentialHash !== user.credentialHash) {
    const attempts = (user.failedCredentialAttempts || 0) + 1;
    const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS).toISOString() : null;
    saveStoredUsers(users.map((u) => u.id === user.id ? { ...u, failedCredentialAttempts: attempts, lockedUntil, lastCredentialAttemptAt: now } : u));
    audit('FAILED_CREDENTIAL_ATTEMPT', user.id, undefined, { attempts });
    return null;
  }
  await recordSuccessfulLogin(user, users);
  return toAppUser(user);
}

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
