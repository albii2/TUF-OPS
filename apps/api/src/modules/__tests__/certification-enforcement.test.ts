import Fastify, { type FastifyInstance } from 'fastify';
import { requireCertification } from '../../auth';
import type { SafeUser } from '../users/users.interface';

/**
 * Certification Enforcement Tests
 *
 * Validates that requireCertification() middleware correctly:
 * - Allows certified REP users through to CRM routes
 * - Blocks uncertified REP users with 403
 * - Allows non-REP roles (ADMIN, DIRECTOR, REGIONAL_DIRECTOR) regardless of certification
 * - Returns 401 when no user is authenticated
 */

function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false });

  // Add a test preHandler that injects a mock user
  app.addHook('onRequest', async (request) => {
    const mockUser = request.headers['x-mock-user'];
    if (mockUser && typeof mockUser === 'string') {
      try {
        request.currentUser = JSON.parse(mockUser) as SafeUser;
      } catch {
        // invalid JSON — leave currentUser undefined
      }
    }
  });

  // Register a test route protected by requireCertification
  app.get('/test-crm-route', { preHandler: [requireCertification()] }, async (_request, reply) => {
    return reply.send({ ok: true });
  });

  return app;
}

function makeRepUser(overrides: Partial<SafeUser> = {}): SafeUser {
  return {
    id: 1,
    name: 'Test Rep',
    email: 'rep@test.local',
    role: 'REP',
    rank: null,
    tier: null,
    region: null,
    state_market: null,
    division: null,
    territory: null,
    subterritory: null,
    sport_focus: null,
    assigned_director_id: null,
    reports_to_user_id: null,
    status: 'ACTIVE',
    must_change_credential: false,
    is_certified: false,
    hr_docs_completed: false,
    director_signed_off: false,
    practical_exercise_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('requireCertification() middleware', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 when no user is authenticated', async () => {
    const res = await app.inject({ method: 'GET', url: '/test-crm-route' });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toHaveProperty('error', 'Authentication required');
  });

  it('returns 403 for uncertified REP user', async () => {
    const user = makeRepUser({ is_certified: false });
    const res = await app.inject({
      method: 'GET',
      url: '/test-crm-route',
      headers: { 'x-mock-user': JSON.stringify(user) },
    });
    expect(res.statusCode).toBe(403);
    const body = res.json();
    expect(body.error).toBe('Certification required');
    expect(body.message).toContain('certification');
  });

  it('returns 200 for certified REP user', async () => {
    const user = makeRepUser({ is_certified: true });
    const res = await app.inject({
      method: 'GET',
      url: '/test-crm-route',
      headers: { 'x-mock-user': JSON.stringify(user) },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it('returns 200 for ADMIN regardless of certification', async () => {
    const user = makeRepUser({ role: 'ADMIN', is_certified: false });
    const res = await app.inject({
      method: 'GET',
      url: '/test-crm-route',
      headers: { 'x-mock-user': JSON.stringify(user) },
    });
    expect(res.statusCode).toBe(200);
  });

  it('returns 200 for DIRECTOR regardless of certification', async () => {
    const user = makeRepUser({ role: 'DIRECTOR', is_certified: false });
    const res = await app.inject({
      method: 'GET',
      url: '/test-crm-route',
      headers: { 'x-mock-user': JSON.stringify(user) },
    });
    expect(res.statusCode).toBe(200);
  });

  it('returns 200 for REGIONAL_DIRECTOR regardless of certification', async () => {
    const user = makeRepUser({ role: 'REGIONAL_DIRECTOR', is_certified: false });
    const res = await app.inject({
      method: 'GET',
      url: '/test-crm-route',
      headers: { 'x-mock-user': JSON.stringify(user) },
    });
    expect(res.statusCode).toBe(200);
  });

  it('returns 200 for OPS regardless of certification', async () => {
    const user = makeRepUser({ role: 'OPS', is_certified: false });
    const res = await app.inject({
      method: 'GET',
      url: '/test-crm-route',
      headers: { 'x-mock-user': JSON.stringify(user) },
    });
    expect(res.statusCode).toBe(200);
  });

  it('gates sales_rep role (alias) same as REP', async () => {
    const user = makeRepUser({ role: 'sales_rep', is_certified: false });
    const res = await app.inject({
      method: 'GET',
      url: '/test-crm-route',
      headers: { 'x-mock-user': JSON.stringify(user) },
    });
    expect(res.statusCode).toBe(403);
  });

  it('allows certified sales_rep through', async () => {
    const user = makeRepUser({ role: 'sales_rep', is_certified: true });
    const res = await app.inject({
      method: 'GET',
      url: '/test-crm-route',
      headers: { 'x-mock-user': JSON.stringify(user) },
    });
    expect(res.statusCode).toBe(200);
  });
});
