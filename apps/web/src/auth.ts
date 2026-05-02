import type { AppUser, Role } from './types';

const ROLE_DEFAULT_USER: Record<Role, string> = {
  OWNER: 'Coach Bradshaw',
  DIRECTOR: 'Dana Holt',
  REP: 'Maya Cole',
  OPS: 'Taylor Reed',
};

const USER_KEY = 'tuf_ops_user_v1';
const ALLOWED_ROLES: Role[] = ['OWNER', 'DIRECTOR', 'REP', 'OPS'];

function isValidStoredUser(value: unknown): value is AppUser {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { name?: unknown; role?: unknown };
  return typeof candidate.name === 'string' && candidate.name.length > 0 && typeof candidate.role === 'string' && ALLOWED_ROLES.includes(candidate.role as Role);
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

export function loginWithPin(pin: string): AppUser | null {
  if (pin !== '0000') return null;
  const user: AppUser = { name: 'Coach Bradshaw', role: 'OWNER' };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export function updateRole(role: Role): AppUser | null {
  const existing = getStoredUser();
  if (!existing) return null;
  const updated = {
    name: existing.role === role ? existing.name : ROLE_DEFAULT_USER[role],
    role,
  };
  localStorage.setItem(USER_KEY, JSON.stringify(updated));
  return updated;
}

export function logout(): void {
  localStorage.removeItem(USER_KEY);
}
