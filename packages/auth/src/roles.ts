export const roles = {
  ADMIN: 'admin',
  REGIONAL_DIRECTOR: 'regional_director',
  DIRECTOR: 'director',
  TAE: 'tae',
  OPERATIONS: 'operations',
} as const;

type ObjectValues<T> = T[keyof T];

export type Role = ObjectValues<typeof roles>;
export type RawRole = Role | 'ADMIN' | 'REGIONAL_DIRECTOR' | 'DIRECTOR' | 'REP' | 'sales_rep' | 'OPS' | 'OWNER' | 'OPERATIONS' | string;

export function normalizeRole(role: unknown): Role | null {
  if (typeof role !== 'string') return null;
  const trimmed = role.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();

  if (trimmed === 'ADMIN' || trimmed === 'OWNER' || lower === roles.ADMIN || lower === 'owner') return roles.ADMIN;
  if (trimmed === 'REGIONAL_DIRECTOR' || lower === roles.REGIONAL_DIRECTOR || lower === 'regional director') return roles.REGIONAL_DIRECTOR;
  if (trimmed === 'DIRECTOR' || lower === roles.DIRECTOR) return roles.DIRECTOR;
  if (trimmed === 'REP' || lower === 'sales_rep' || lower === roles.TAE) return roles.TAE;
  if (trimmed === 'OPS' || trimmed === 'OPERATIONS' || lower === roles.OPERATIONS || lower === 'ops') return roles.OPERATIONS;
  return null;
}

export function isAdmin(role: unknown): boolean {
  return normalizeRole(role) === roles.ADMIN;
}

export function isRegionalDirector(role: unknown): boolean {
  return normalizeRole(role) === roles.REGIONAL_DIRECTOR;
}

export function isDirector(role: unknown): boolean {
  return normalizeRole(role) === roles.DIRECTOR;
}

export function isTae(role: unknown): boolean {
  return normalizeRole(role) === roles.TAE;
}

export function isOperations(role: unknown): boolean {
  return normalizeRole(role) === roles.OPERATIONS;
}
