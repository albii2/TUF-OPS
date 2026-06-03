import { pool } from '@packages/database';
import { generateTemporaryCredential, hashCredential, validatePermanentCredential, validateTemporaryCredential, verifyCredential } from '../credentials';
import { __test, listUsers, seedInitialOwnerIfEmpty } from '../users.service';
import type { SafeUser } from '../users.interface';

jest.mock('@packages/database', () => ({
  pool: { query: jest.fn(async () => ({ rows: [] })) },
}));

const owner: SafeUser = { id: 7, name: 'Owner', email: 'owner@tuf.local', role: 'OWNER', territory: null, assigned_director_id: null, status: 'ACTIVE', must_change_credential: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
const rep: SafeUser = { ...owner, id: 8, role: 'REP', email: 'rep@tuf.local' };

describe('secure user credentials', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'test' };
    (pool.query as jest.Mock).mockReset();
    (pool.query as jest.Mock).mockResolvedValue({ rows: [] } as any);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

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

  it('verifies signed auth tokens and rejects tampered actor identities', async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [owner] } as any);

    const token = __test.createAuthToken(owner as any);
    await expect(__test.verifyAuthToken(token)).resolves.toMatchObject({ id: 7, role: 'OWNER' });

    const [payload, signature] = token.split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ userId: 1, expiresAt: Date.now() + 60_000 })).toString('base64url');
    await expect(__test.verifyAuthToken(`${forgedPayload}.${signature}`)).resolves.toBeNull();
    await expect(__test.verifyAuthToken(`${payload}.bad-signature`)).resolves.toBeNull();
  });

  it('requires a real auth token secret outside local development', () => {
    delete process.env.AUTH_TOKEN_SECRET;
    delete process.env.SESSION_SECRET;
    delete process.env.ALLOW_INSECURE_DEV_AUTH_SECRET;
    process.env.NODE_ENV = 'production';
    expect(() => __test.getAuthTokenSecret()).toThrow('AUTH_TOKEN_SECRET or SESSION_SECRET is required outside local development');
  });

  it('requires an explicit bootstrap owner credential before seeding or promoting an owner', async () => {
    delete process.env.INITIAL_OWNER_CREDENTIAL;
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ count: 0 }] } as any)
      .mockResolvedValueOnce({ rows: [{ count: 1 }] } as any);

    await expect(seedInitialOwnerIfEmpty()).rejects.toThrow('INITIAL_OWNER_CREDENTIAL is required');
  });

  it('restricts user roster listing to owner/admin actors', async () => {
    await expect(listUsers(rep)).rejects.toThrow('Only Owner/Admin users can manage credentials');

    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [owner] } as any);
    await expect(listUsers(owner)).resolves.toEqual([owner]);
  });
});
