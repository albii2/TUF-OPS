import type { AppUser, Role } from './types';

const USER_KEY = 'tuf_ops_user_v1';

export function getStoredUser(): AppUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppUser;
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
  const updated = { ...existing, role };
  localStorage.setItem(USER_KEY, JSON.stringify(updated));
  return updated;
}

export function logout(): void {
  localStorage.removeItem(USER_KEY);
}
