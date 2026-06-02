import { generateTemporaryCredential, hashCredential, validatePermanentCredential, validateTemporaryCredential, verifyCredential } from '../credentials';
import { __test } from '../users.service';

jest.mock('@packages/database', () => ({
  pool: { query: jest.fn(async () => ({ rows: [] })) },
}));

describe('secure user credentials', () => {
  it('hashes credentials and never treats hashes as the original credential', async () => {
    const hash = await hashCredential('4826');
    expect(hash).not.toContain('4826');
    await expect(verifyCredential('4826', hash)).resolves.toBe(true);
    await expect(verifyCredential('0000', hash)).resolves.toBe(false);
  });

  it('generates temporary numeric credentials and validates weak permanent values', () => {
    const temporaryCredential = generateTemporaryCredential();
    expect(temporaryCredential).toMatch(/^\d{6}$/);
    expect(() => validateTemporaryCredential('1234')).not.toThrow();
    expect(() => validateTemporaryCredential('')).toThrow('Credential is required');
    expect(() => validateTemporaryCredential('abc')).toThrow('Credential must be at least 4 numbers');
    expect(() => validatePermanentCredential('1234')).toThrow('Choose a less obvious credential');
  });

  it('sanitizes user records before API responses', () => {
    const safe = __test.sanitizeUser({ id: 1, name: 'Owner', email: 'owner@tuf.local', role: 'OWNER', credential_hash: 'secret', password: 'secret', password_hash: 'secret' });
    expect((safe as any).credential_hash).toBeUndefined();
    expect((safe as any).password).toBeUndefined();
    expect((safe as any).password_hash).toBeUndefined();
  });
});
