import { getPermissions, normalizeRole, type Permission, type Role } from './roles.js';

export * from './roles.js';

export interface User {
  id: string | number;
  role?: Role | string;
  roles?: Array<Role | string>;
}

export class PermissionDenied extends Error {
  statusCode = 403;

  constructor(message: string) {
    super(message);
    this.name = 'PermissionDenied';
  }
}

export function hasPermission(userOrRole: User | Role | string | null | undefined, permission: Permission): boolean {
  if (!userOrRole) return false;
  if (typeof userOrRole === 'string') return getPermissions(userOrRole).has(permission);

  const roles = userOrRole.roles?.length ? userOrRole.roles : userOrRole.role ? [userOrRole.role] : [];
  return roles.some((role) => getPermissions(role).has(permission));
}

export function requirePermission(userOrRole: User | Role | string | null | undefined, permission: Permission): void {
  if (hasPermission(userOrRole, permission)) return;
  const rawRole = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role ?? userOrRole?.roles?.[0] ?? 'anonymous';
  const normalized = normalizeRole(rawRole)?.valueOf() ?? String(rawRole);
  throw new PermissionDenied(`Permission '${permission}' required. Your role '${normalized}' does not have it.`);
}

export function requireRole(userOrRole: User | Role | string | null | undefined, role: Role): void {
  const roles = typeof userOrRole === 'string' ? [userOrRole] : userOrRole?.roles?.length ? userOrRole.roles : userOrRole?.role ? [userOrRole.role] : [];
  if (roles.some((candidate) => normalizeRole(candidate) === role)) return;
  throw new PermissionDenied(`Role '${role}' required.`);
}
