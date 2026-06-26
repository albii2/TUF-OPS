import { getPermissions, hasPermission, isAdmin, isDirector, isOperations, isRegionalDirector, isTae, normalizeRole, permissions, requirePermission, roles, rolePermissions, PermissionDenied, type User } from '../index';

describe('TUF compatibility role and permission foundation', () => {
  it('normalizes existing database roles to canonical app roles', () => {
    expect(normalizeRole('ADMIN')).toBe(roles.ADMIN);
    expect(normalizeRole('REGIONAL_DIRECTOR')).toBe(roles.REGIONAL_DIRECTOR);
    expect(normalizeRole('DIRECTOR')).toBe(roles.DIRECTOR);
    expect(normalizeRole('REP')).toBe(roles.TAE);
    expect(normalizeRole('sales_rep')).toBe(roles.TAE);
    expect(normalizeRole('operations')).toBe(roles.OPERATIONS);
  });

  it('exposes role predicate helpers on normalized roles', () => {
    expect(isAdmin('ADMIN')).toBe(true);
    expect(isRegionalDirector('REGIONAL_DIRECTOR')).toBe(true);
    expect(isDirector('DIRECTOR')).toBe(true);
    expect(isTae('REP')).toBe(true);
    expect(isTae('sales_rep')).toBe(true);
    expect(isOperations('operations')).toBe(true);
    expect(isAdmin('REP')).toBe(false);
  });

  it('defines exactly 35 permissions and canonical roles including operations', () => {
    expect(Object.keys(permissions)).toHaveLength(35);
    expect(Object.values(roles)).toEqual(['admin', 'regional_director', 'director', 'tae', 'operations']);
  });

  it('maps canonical role permission counts safely', () => {
    expect(rolePermissions[roles.ADMIN]).toHaveLength(35);
    expect(rolePermissions[roles.REGIONAL_DIRECTOR]).toHaveLength(31);
    expect(rolePermissions[roles.TAE]).toHaveLength(19);
    expect(rolePermissions[roles.DIRECTOR]).toHaveLength(30);
    expect(rolePermissions[roles.OPERATIONS]).toHaveLength(12);
  });

  it('gives REP and sales_rep the TAE permission profile', () => {
    for (const legacyRole of ['REP', 'sales_rep']) {
      const perms = getPermissions(legacyRole);
      expect(perms.has(permissions.CREATE_ORGANIZATION)).toBe(true);
      expect(perms.has(permissions.SET_CLOSED_WON)).toBe(false);
      expect(perms.has(permissions.UPDATE_FULFILLMENT_STAGE)).toBe(false);
    }
  });

  it('gives REGIONAL_DIRECTOR more than state director but less than admin permissions', () => {
    const perms = getPermissions('REGIONAL_DIRECTOR');
    expect(perms.has(permissions.SET_CLOSED_WON)).toBe(true);
    expect(perms.has(permissions.VIEW_OPERATIONS_QUEUE)).toBe(true);
    expect(perms.has(permissions.UPDATE_FULFILLMENT_STAGE)).toBe(false);
  });

  it('gives DIRECTOR director permissions', () => {
    const perms = getPermissions('DIRECTOR');
    expect(perms.has(permissions.SET_CLOSED_WON)).toBe(true);
    expect(perms.has(permissions.ASSIGN_LEAD_TEAM)).toBe(true);
    expect(perms.has(permissions.UPDATE_FULFILLMENT_STAGE)).toBe(false);
  });

  it('gives ADMIN admin permissions', () => {
    const perms = getPermissions('ADMIN');
    expect(perms.has(permissions.CONFIGURE_TERRITORY)).toBe(true);
    expect(perms.has(permissions.UPDATE_FULFILLMENT_STAGE)).toBe(true);
    expect(perms.has(permissions.CREATE_OPPORTUNITY)).toBe(true);
    expect(perms.size).toBe(Object.keys(permissions).length);
  });

  it('unknown roles fail safely without privileged permissions', () => {
    expect(normalizeRole('nonexistent')).toBeNull();
    expect(getPermissions('nonexistent').size).toBe(0);
    expect(hasPermission('nonexistent', permissions.CONFIGURE_TERRITORY)).toBe(false);
  });

  it('evaluates permissions for users and throws descriptive permission errors', () => {
    const director: User = { id: 1, role: 'DIRECTOR' };
    const legacyRep: User = { id: 2, roles: ['REP'] };
    expect(hasPermission(director, permissions.SET_CLOSED_WON)).toBe(true);
    expect(hasPermission(legacyRep, permissions.CREATE_ORGANIZATION)).toBe(true);
    expect(() => requirePermission(legacyRep, permissions.SET_CLOSED_WON)).toThrow(PermissionDenied);
    expect(() => requirePermission(legacyRep, permissions.SET_CLOSED_WON)).toThrow('set_closed_won');
  });

  it('gives TAE EDIT_RELATIONSHIP_FIELDS permission for stage-based degradation', () => {
    const taePerms = getPermissions('REP');
    expect(taePerms.has(permissions.EDIT_RELATIONSHIP_FIELDS)).toBe(true);
    // Directors and Ops do NOT have this permission
    expect(getPermissions('DIRECTOR').has(permissions.EDIT_RELATIONSHIP_FIELDS)).toBe(false);
    expect(getPermissions('operations').has(permissions.EDIT_RELATIONSHIP_FIELDS)).toBe(false);
  });
});
