"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("@packages/database");
const credentials_1 = require("../credentials");
const users_service_1 = require("../users.service");
jest.mock('@packages/database', () => ({
    pool: { query: jest.fn(async () => ({ rows: [] })) },
}));
const owner = { id: 7, name: 'Owner', email: 'owner@tuf.local', role: 'OWNER', territory: null, assigned_director_id: null, status: 'ACTIVE', must_change_credential: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
const rep = { ...owner, id: 8, role: 'REP', email: 'rep@tuf.local' };
describe('secure user credentials', () => {
    const originalEnv = process.env;
    beforeEach(() => {
        process.env = { ...originalEnv, NODE_ENV: 'test' };
        database_1.pool.query.mockReset();
        database_1.pool.query.mockResolvedValue({ rows: [] });
    });
    afterAll(() => {
        process.env = originalEnv;
    });
    it('hashes credentials and never treats hashes as the original credential', async () => {
        const hash = await (0, credentials_1.hashCredential)('4826');
        expect(hash).not.toContain('4826');
        await expect((0, credentials_1.verifyCredential)('4826', hash)).resolves.toBe(true);
        await expect((0, credentials_1.verifyCredential)('0000', hash)).resolves.toBe(false);
    });
    it('generates temporary numeric credentials and validates weak permanent values', () => {
        const temporaryCredential = (0, credentials_1.generateTemporaryCredential)();
        expect(temporaryCredential).toMatch(/^\d{6}$/);
        expect(() => (0, credentials_1.validateTemporaryCredential)('1234')).not.toThrow();
        expect(() => (0, credentials_1.validateTemporaryCredential)('')).toThrow('Credential is required');
        expect(() => (0, credentials_1.validateTemporaryCredential)('abc')).toThrow('Credential must be at least 4 numbers');
        expect(() => (0, credentials_1.validatePermanentCredential)('1234')).toThrow('Choose a less obvious credential');
    });
    it('sanitizes user records before API responses', () => {
        const safe = users_service_1.__test.sanitizeUser({ id: 1, name: 'Owner', email: 'owner@tuf.local', role: 'OWNER', credential_hash: 'secret', password: 'secret', password_hash: 'secret' });
        expect(safe.credential_hash).toBeUndefined();
        expect(safe.password).toBeUndefined();
        expect(safe.password_hash).toBeUndefined();
    });
    it('verifies signed auth tokens and rejects tampered actor identities', async () => {
        database_1.pool.query.mockResolvedValue({ rows: [owner] });
        const token = users_service_1.__test.createAuthToken(owner);
        await expect(users_service_1.__test.verifyAuthToken(token)).resolves.toMatchObject({ id: 7, role: 'OWNER' });
        const [payload, signature] = token.split('.');
        const forgedPayload = Buffer.from(JSON.stringify({ userId: 1, expiresAt: Date.now() + 60_000 })).toString('base64url');
        await expect(users_service_1.__test.verifyAuthToken(`${forgedPayload}.${signature}`)).resolves.toBeNull();
        await expect(users_service_1.__test.verifyAuthToken(`${payload}.bad-signature`)).resolves.toBeNull();
    });
    it('requires a real auth token secret outside local development', () => {
        delete process.env.AUTH_TOKEN_SECRET;
        delete process.env.SESSION_SECRET;
        delete process.env.ALLOW_INSECURE_DEV_AUTH_SECRET;
        process.env.NODE_ENV = 'production';
        expect(() => users_service_1.__test.getAuthTokenSecret()).toThrow('AUTH_TOKEN_SECRET or SESSION_SECRET is required outside local development');
    });
    it('allows local/test bootstrap owner seeding without requiring env credentials', async () => {
        delete process.env.INITIAL_OWNER_CREDENTIAL;
        database_1.pool.query
            .mockResolvedValueOnce({ rows: [{ count: 0 }] })
            .mockResolvedValueOnce({ rows: [{ count: 1 }] })
            .mockResolvedValueOnce({ rows: [] });
        await expect((0, users_service_1.seedInitialOwnerIfEmpty)()).resolves.toBeUndefined();
        expect(database_1.pool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE users'), [expect.stringMatching(/^scrypt\$/)]);
    });
    it('requires an explicit bootstrap owner credential in production', async () => {
        delete process.env.INITIAL_OWNER_CREDENTIAL;
        process.env.NODE_ENV = 'production';
        database_1.pool.query
            .mockResolvedValueOnce({ rows: [{ count: 0 }] })
            .mockResolvedValueOnce({ rows: [{ count: 1 }] });
        await expect((0, users_service_1.seedInitialOwnerIfEmpty)()).rejects.toThrow('INITIAL_OWNER_CREDENTIAL is required');
    });
    it('restricts user roster listing to owner/admin actors', async () => {
        await expect((0, users_service_1.listUsers)(rep)).rejects.toThrow('Only Owner/Admin users can manage credentials');
        database_1.pool.query.mockResolvedValueOnce({ rows: [owner] });
        await expect((0, users_service_1.listUsers)(owner)).resolves.toEqual([owner]);
    });
});
//# sourceMappingURL=credentials.test.js.map