import { test, expect } from '@playwright/test';
import { validateAssignment } from './mutations';

test.describe('validateAssignment', () => {
  test('should allow an admin to assign to anyone', async () => {
    const admin: any = { id: '1', role: 'admin' };
    const result = await validateAssignment(admin, 2);
    expect(result).toEqual({ allowed: true });
  });

  test('should not allow a rep to reassign', async () => {
    const rep: any = { id: '2', role: 'rep' };
    await expect(validateAssignment(rep, 3)).rejects.toThrow('Unauthorized: Reps cannot reassign opportunities.');
  });

  test('should allow a director to assign to themselves', async () => {
    const director: any = { id: '3', role: 'director' };
    const result = await validateAssignment(director, 3);
    expect(result).toEqual({ allowed: true });
  });

  test('should not allow a director to assign to someone outside their team', async () => {
    const director: any = { id: '3', role: 'director' };
    await expect(validateAssignment(director, 4)).rejects.toThrow('Unauthorized: Directors can only assign to themselves or their direct reports.');
  });
});