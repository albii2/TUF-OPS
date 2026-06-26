import { canonicalRoles, normalizeRole, type CanonicalRole } from './roles';

export const permissions = {
  VIEW_ADMIN_DASHBOARD: 'view_admin_dashboard',
  VIEW_DIRECTOR_DASHBOARD: 'view_director_dashboard',
  VIEW_TAE_DASHBOARD: 'view_tae_dashboard',
  VIEW_OPERATIONS_DASHBOARD: 'view_operations_dashboard',
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions];

const rolePermissions: Record<CanonicalRole, readonly Permission[]> = {
  [canonicalRoles.ADMIN]: Object.values(permissions),
  [canonicalRoles.DIRECTOR]: [permissions.VIEW_DIRECTOR_DASHBOARD, permissions.VIEW_TAE_DASHBOARD],
  [canonicalRoles.TAE]: [permissions.VIEW_TAE_DASHBOARD],
  [canonicalRoles.OPERATIONS]: [permissions.VIEW_OPERATIONS_DASHBOARD],
};

export function hasPermission(role: unknown, permission: Permission): boolean {
  const normalized = normalizeRole(role);
  return normalized ? rolePermissions[normalized].includes(permission) : false;
}
