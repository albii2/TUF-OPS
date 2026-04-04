import { validateAssignment } from './mutations';
import { prisma } from '@/lib/prisma';

describe('validateAssignment', () => {
  it('should allow an admin to assign to anyone', async () => {
    const admin: any = { id: '1', role: 'admin' };
    const result = await validateAssignment(admin, 2);
    expect(result.allowed).toBe(true);
  });

  it('should not allow a rep to assign', async () => {
    const rep: any = { id: '2', role: 'rep' };
    await expect(validateAssignment(rep, 3)).rejects.toThrow('Unauthorized: Reps cannot reassign opportunities.');
  });

  it('should allow a director to assign to themselves', async () => {
    const director: any = { id: '1', role: 'director' };
    const result = await validateAssignment(director, 1);
    expect(result.allowed).toBe(true);
  });

  it('should not allow a director to assign to someone outside their team', async () => {
    const director: any = { id: '1', role: 'director' };
    await expect(validateAssignment(director, 100)).rejects.toThrow('Unauthorized: Directors can only assign to themselves or their direct reports.');
  });
});
