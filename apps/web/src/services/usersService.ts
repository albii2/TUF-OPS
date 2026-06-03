import type { AppUser, Role } from '../types';
import type { TerritoryId } from '../data/mockSalesData';

export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type ManagedUser = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  role: Role;
  territory: TerritoryId | '';
  assignedDirectorId?: string;
  status: UserStatus;
  avatarColor: string;
  mustChangeCredential: boolean;
  lastLoginAt?: string;
  lastCredentialAttemptAt?: string;
  lastActivityAt?: string;
  loginCount?: number;
  failedCredentialAttempts?: number;
  lockedUntil?: string | null;
};

type StoredManagedUser = ManagedUser & {
  credentialHash: string;
  credentialSalt: string;
  failedCredentialAttempts?: number;
  lockedUntil?: string | null;
};

export type CredentialAuditAction = 'USER_CREATED' | 'TEMPORARY_CREDENTIAL_GENERATED' | 'CREDENTIAL_RESET' | 'CREDENTIAL_CHANGED' | 'FAILED_CREDENTIAL_ATTEMPT' | 'SUCCESSFUL_LOGIN';
export type CredentialAuditEntry = { id: string; action: CredentialAuditAction; targetUserId?: string; actorUserId?: string; createdAt: string; metadata: Record<string, unknown> };

const KEY = 'tuf_ops_users_v4';
const LEGACY_USER_KEYS = ['tuf_ops_users_v1', 'tuf_ops_users_v2', 'tuf_ops_users_v3'];
const AUDIT_KEY = 'tuf_ops_credential_audit_v1';
const COLORS = ['#1FB6FF', '#22C55E', '#F59E0B', '#A855F7', '#EF4444', '#14B8A6'];
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const seedRows: StoredManagedUser[] = [
  {
    id: 'u-owner-coach-bradshaw',
    firstName: 'Coach',
    lastName: 'Bradshaw',
    displayName: 'Coach Bradshaw',
    email: 'owner@tuf.local',
    role: 'OWNER',
    territory: 'metro',
    status: 'ACTIVE',
    avatarColor: COLORS[0],
    mustChangeCredential: false,
    failedCredentialAttempts: 0,
    lockedUntil: null,
    loginCount: 0,
    credentialSalt: 'seed-owner',
    credentialHash: 'b8bd4925bf3c03b20feaa71da92aa34591227c16ce8540287289839226c499d3',
  },

  {
    id: 'u-test-director-agent',
    firstName: 'Test',
    lastName: 'Director',
    displayName: 'Test Director',
    email: 'test.director@tuf.local',
    role: 'DIRECTOR',
    territory: 'north',
    status: 'ACTIVE',
    avatarColor: COLORS[2],
    mustChangeCredential: false,
    failedCredentialAttempts: 0,
    lockedUntil: null,
    loginCount: 0,
    credentialSalt: 'seed-test-director',
    credentialHash: 'd740b50835303b3f2a83c91e14c126dd7e4742f8b41f0d724faafd513814fcab',
  },
  {
    id: 'u-test-rep-agent',
    firstName: 'Test',
    lastName: 'Rep',
    displayName: 'Test Rep',
    email: 'test.rep@tuf.local',
    role: 'REP',
    territory: 'north',
    assignedDirectorId: 'u-test-director-agent',
    status: 'ACTIVE',
    avatarColor: COLORS[3],
    mustChangeCredential: false,
    failedCredentialAttempts: 0,
    lockedUntil: null,
    loginCount: 0,
    credentialSalt: 'seed-test-rep',
    credentialHash: 'cde7539b2567b8d2ceede14bb91469c1cf9ad66be3ffd069080c4af446e6f820',
  },
  {
    id: 'u-director-primeau-hill',
    firstName: 'Primeau',
    lastName: 'Hill',
    displayName: 'Primeau Hill',
    email: 'primeau@tuf.local',
    role: 'DIRECTOR',
    territory: 'west',
    status: 'ACTIVE',
    avatarColor: COLORS[1],
    mustChangeCredential: false,
    failedCredentialAttempts: 0,
    lockedUntil: null,
    loginCount: 0,
    credentialSalt: 'seed-primeau',
    credentialHash: 'ac57fe25e58cda65ee04575f5cd22a908d1b975c072e28fc350514e76f48f982',
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

function saveStoredUsers(rows: StoredManagedUser[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

function readStoredUsers(): StoredManagedUser[] {
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
    const safeRows = migrated.map(({ pin: _pin, ...row }: any) => row) as StoredManagedUser[];
    const mergedRows = [
      ...safeRows,
      ...seedRows.filter((seed) => !safeRows.some((row) => row.id === seed.id || row.displayName === seed.displayName)),
    ];
    if (migrated.some((row: any) => row.pin) || migrated.length !== rows.length || mergedRows.length !== rows.length) {
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

export async function createUser(input: Omit<ManagedUser, 'id' | 'displayName' | 'avatarColor' | 'mustChangeCredential'> & { temporaryCredential?: string }, actor?: AppUser | null) {
  if (actor?.role !== 'OWNER') throw new Error('Only Owner/Admin users can create users');
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
  if (actor?.role !== 'OWNER' && actor?.role !== 'DIRECTOR') throw new Error('Only Owner/Admin or Director users can update assignments');
  const users = readStoredUsers();
  const target = users.find((u) => u.id === id);
  if (!target) return;
  if (target.role === 'OWNER' && patch.status === 'INACTIVE') throw new Error('Cannot archive the owner');
  const rows = users.map((u) => (u.id === id ? { ...u, ...patch, displayName: `${patch.firstName ?? u.firstName} ${patch.lastName ?? u.lastName}`.trim() } : u));
  saveStoredUsers(rows);
}

export async function resetUserCredential(id: string, actor?: AppUser | null) {
  if (actor?.role !== 'OWNER') throw new Error('Only Owner/Admin users can reset credentials');
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

function toAppUser(user: StoredManagedUser): AppUser {
  return { id: user.id, name: user.displayName, email: user.email, role: user.role, mustChangeCredential: user.mustChangeCredential };
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
