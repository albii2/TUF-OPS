import { hasPermission, roles, permissions, User } from '../index.js';

describe('hasPermission', () => {
  it('should return true for a user with the required permission', () => {
    const user: User = { id: '1', roles: [roles.ADMIN] };
    expect(hasPermission(user, permissions.ORGANIZATIONS_WRITE)).toBe(true);
  });

  it('should return false for a user without the required permission', () => {
    const user: User = { id: '1', roles: [roles.USER] };
    expect(hasPermission(user, permissions.ORGANIZATIONS_WRITE)).toBe(false);
  });

  it('should return false for a user with no roles', () => {
    const user: User = { id: '1', roles: [] };
    expect(hasPermission(user, permissions.ORGANIZATIONS_READ)).toBe(false);
  });

  it('should return false for a null or undefined user', () => {
    expect(hasPermission(null!, permissions.ORGANIZATIONS_READ)).toBe(false);
    expect(hasPermission(undefined!, permissions.ORGANIZATIONS_READ)).toBe(false);
  });

  it('should handle users with multiple roles', () => {
    const user: User = { id: '1', roles: [roles.USER, roles.ADMIN] };
    expect(hasPermission(user, permissions.ORGANIZATIONS_WRITE)).toBe(true);
  });
});
