import type { AppUser, Role } from './types';
import { authenticateWithCredential, authenticateWithPin, getActiveUserByRole } from './services/usersService';

const USER_KEY = 'tuf_ops_user_v3';
const ALLOWED_ROLES: Role[] = ['ADMIN', 'REGIONAL_DIRECTOR', 'DIRECTOR', 'REP'];

function persistUser(user: AppUser): AppUser {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('tuf:user-updated', { detail: user }));
  return user;
}

function isValidStoredUser(value: unknown): value is AppUser {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { id?: unknown; name?: unknown; email?: unknown; role?: unknown; mustChangeCredential?: unknown };
  return typeof candidate.id === 'string' && typeof candidate.name === 'string' && typeof candidate.email === 'string' && typeof candidate.role === 'string' && typeof candidate.mustChangeCredential === 'boolean' && ALLOWED_ROLES.includes(candidate.role as Role);
}

export function getStoredUser(): AppUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!isValidStoredUser(parsed)) {
      localStorage.removeItem(USER_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function loginWithPin(pin: string): Promise<AppUser | null> {
  try {
    const matched = await authenticateWithPin(pin);
    if (!matched) return null;
    return persistUser(matched);
  } catch {
    return null;
  }
}


export async function loginWithCredential(emailOrName: string, credential: string): Promise<AppUser | null> {
  const matched = await authenticateWithCredential(emailOrName, credential);
  if (!matched) return null;
  return persistUser(matched);
}

export function updateRole(role: Role): AppUser | null {
  const existing = getStoredUser();
  if (!existing) return null;
  if (existing.role === role) return existing;
  const active = getActiveUserByRole(role);
  if (!active) return null;
  const updated: AppUser = {
    id: active.id,
    name: active.displayName,
    email: active.email,
    role,
    rank: active.rank ?? null,
    tier: active.tier ?? null,
    region: active.region ?? null,
    state_market: active.state_market ?? null,
    division: active.division ?? null,
    territory: active.territory ?? null,
    subterritory: active.subterritory ?? null,
    sport_focus: active.sport_focus ?? null,
    assigned_director_id: active.assignedDirectorId ? Number(active.assignedDirectorId.replace(/\D/g, '')) : null,
    reports_to_user_id: active.reports_to_user_id ? Number(active.reports_to_user_id.replace(/\D/g, '')) : null,
    mustChangeCredential: active.mustChangeCredential,
    hrDocsCompleted: active.hrDocsCompleted,
    directorSignedOff: active.directorSignedOff,
    practicalExerciseCompleted: active.practicalExerciseCompleted,
    isCertified: active.isCertified,
  };
  return persistUser(updated);
}

export function updateStoredUser(user: AppUser): AppUser {
  return persistUser(user);
}

export function logout(): void {
  localStorage.removeItem(USER_KEY);
}
