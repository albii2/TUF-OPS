import { rolePermissions, Role, Permission } from './roles.js';

export * from './roles.js';

export interface User {
  id: string;
  roles: Role[];
}

export function hasPermission(user: User, permission: Permission): boolean {
  if (!user || !user.roles) {
    return false;
  }

  for (const role of user.roles) {
    const userPermissions = rolePermissions[role] as Permission[];
    if (userPermissions && userPermissions.includes(permission)) {
      return true;
    }
  }

  return false;
}
