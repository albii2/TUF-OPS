export const canonicalRoles = {
  ADMIN: 'admin',
  REGIONAL_DIRECTOR: 'regional_director',
  DIRECTOR: 'director',
  TAE: 'tae',
  OPERATIONS: 'operations',
} as const;

export type CanonicalRole = (typeof canonicalRoles)[keyof typeof canonicalRoles];

export function normalizeRole(role: unknown): CanonicalRole | null {
  if (typeof role !== 'string') return null;
  const trimmed = role.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();

  if (trimmed === 'ADMIN' || trimmed === 'OWNER' || lower === 'admin' || lower === 'owner') return canonicalRoles.ADMIN;
  if (trimmed === 'REGIONAL_DIRECTOR' || lower === 'regional_director' || lower === 'regional director') return canonicalRoles.REGIONAL_DIRECTOR;
  if (trimmed === 'DIRECTOR' || lower === 'director') return canonicalRoles.DIRECTOR;
  if (trimmed === 'REP' || lower === 'sales_rep' || lower === 'tae') return canonicalRoles.TAE;
  if (trimmed === 'OPS' || trimmed === 'OPERATIONS' || lower === 'operations' || lower === 'ops') return canonicalRoles.OPERATIONS;
  return null;
}

export function isAdmin(role: unknown): boolean {
  return normalizeRole(role) === canonicalRoles.ADMIN;
}

export function isRegionalDirector(role: unknown): boolean {
  return normalizeRole(role) === canonicalRoles.REGIONAL_DIRECTOR;
}

export function isDirector(role: unknown): boolean {
  return normalizeRole(role) === canonicalRoles.DIRECTOR;
}

export function isTae(role: unknown): boolean {
  return normalizeRole(role) === canonicalRoles.TAE;
}

export function isOperations(role: unknown): boolean {
  return normalizeRole(role) === canonicalRoles.OPERATIONS;
}
