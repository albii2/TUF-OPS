export const roles = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export const permissions = {
  ORGANIZATIONS_READ: 'organizations:read',
  ORGANIZATIONS_WRITE: 'organizations:write',
  OPPORTUNITIES_READ: 'opportunities:read',
  OPPORTUNITIES_WRITE: 'opportunities:write',
} as const;

export const rolePermissions = {
  [roles.ADMIN]: [
    permissions.ORGANIZATIONS_READ,
    permissions.ORGANIZATIONS_WRITE,
    permissions.OPPORTUNITIES_READ,
    permissions.OPPORTUNITIES_WRITE,
  ],
  [roles.USER]: [
    permissions.ORGANIZATIONS_READ,
    permissions.OPPORTUNITIES_READ,
  ],
};

type ObjectValues<T> = T[keyof T];

export type Role = ObjectValues<typeof roles>;
export type Permission = ObjectValues<typeof permissions>;
