import { getPermissions, hasPermission, permissions, requirePermission, roles, rolePermissions, PermissionDenied, type User } from '../index';

describe('TUF role-based permissions', () => {
  it('defines exactly 34 permissions and three roles', () => {
    expect(Object.keys(permissions)).toHaveLength(34);
    expect(Object.values(roles)).toEqual(['tae', 'director', 'operations']);
  });

  it('matches required permission counts', () => {
    expect(rolePermissions[roles.TAE]).toHaveLength(18);
    expect(rolePermissions[roles.DIRECTOR]).toHaveLength(30);
    expect(rolePermissions[roles.OPERATIONS]).toHaveLength(12);
  });

  it('denies TAE director and operations permissions', () => {
    const taePerms = getPermissions(roles.TAE);
    expect(taePerms.has(permissions.SET_CLOSED_WON)).toBe(false);
    expect(taePerms.has(permissions.VIEW_TEAM_PIPELINE)).toBe(false);
    expect(taePerms.has(permissions.UPDATE_FULFILLMENT_STAGE)).toBe(false);
  });

  it('denies operations sales, lead, and relationship permissions', () => {
    const opsPerms = getPermissions(roles.OPERATIONS);
    expect(opsPerms.has(permissions.CREATE_OPPORTUNITY)).toBe(false);
    expect(opsPerms.has(permissions.VIEW_PERSONAL_PIPELINE)).toBe(false);
    expect(opsPerms.has(permissions.CLAIM_UNASSIGNED_LEAD)).toBe(false);
    expect(opsPerms.has(permissions.LOG_RELATIONSHIP_ACTIVITY)).toBe(false);
  });

  it('allows director QA and lead control but denies fulfillment updates', () => {
    const directorPerms = getPermissions(roles.DIRECTOR);
    expect(directorPerms.has(permissions.SET_CLOSED_WON)).toBe(true);
    expect(directorPerms.has(permissions.ASSIGN_LEAD_TEAM)).toBe(true);
    expect(directorPerms.has(permissions.UPDATE_FULFILLMENT_STAGE)).toBe(false);
  });

  it('evaluates permissions for users and legacy role names', () => {
    const director: User = { id: 1, role: roles.DIRECTOR };
    const legacyRep: User = { id: 2, roles: ['REP'] };
    expect(hasPermission(director, permissions.SET_CLOSED_WON)).toBe(true);
    expect(hasPermission(legacyRep, permissions.CREATE_ORGANIZATION)).toBe(true);
    expect(hasPermission(legacyRep, permissions.SET_CLOSED_WON)).toBe(false);
  });

  it('throws descriptive permission errors', () => {
    expect(() => requirePermission({ id: 1, role: roles.TAE }, permissions.SET_CLOSED_WON)).toThrow(PermissionDenied);
    expect(() => requirePermission({ id: 1, role: roles.TAE }, permissions.SET_CLOSED_WON)).toThrow('set_closed_won');
  });

  it('returns an empty permission set for unknown roles', () => {
    expect(getPermissions('nonexistent').size).toBe(0);
  });
});
