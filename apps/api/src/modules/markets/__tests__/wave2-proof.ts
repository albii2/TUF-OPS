/**
 * TUF Ops 2.0 — Wave 2 proof suite: operational Markets read + auth boundary.
 *
 * Run with:
 *   DATABASE_URL=postgresql://postgres@127.0.0.1:55432/railway \
 *     npx tsx apps/api/src/modules/markets/__tests__/wave2-proof.ts
 *
 * Safety: this suite is READ-ONLY. It opens one connection in a read-only
 * transaction (SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY) and rolls
 * back. It never writes, never activates, never touches the legacy database.
 *
 * Proves, for the Wave-2 surface:
 *   (a) the operational markets read returns EXACTLY the 3 activated markets
 *       (001 Pillager, 002 Pequot Lakes, 003 Brainerd) — not the 272-universe,
 *   (b) a universe-only school (id 98 Academy of Holy Angels, and all 269
 *       unactivated organizations) returns NOTHING operational,
 *   (c) the auth boundary returns 401 for anonymous and 403 for an
 *       unauthorized role, while an authorized role gets the real list.
 */

import { Client } from 'pg';
import Fastify from 'fastify';

import {
  countOperationalMarkets,
  findMarketByUniverseOrganization,
  getMarketByIdOrNumber,
  listOperationalMarkets,
} from '../markets.read.service.js';
import type { DbClientLike, DbPoolLike } from '../markets.interface.js';
import { marketsRoutes } from '../markets.routes.js';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Refusing to run: set DATABASE_URL to the target 2.0 database.');
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Minimal harness (mirrors the Wave-1 runner)
// ---------------------------------------------------------------------------
interface CaseResult {
  name: string;
  ok: boolean;
  error?: string;
}
const results: CaseResult[] = [];

async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ok   ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, ok: false, error: message });
    console.log(`  FAIL ${name}\n         ${message}`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`assertion failed: ${message}`);
}

function assertEqual(actual: unknown, expected: unknown, message: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${message}: expected ${e}, got ${a}`);
}

// ---------------------------------------------------------------------------
// A read-only, single-connection pool handed to the read service.
// ---------------------------------------------------------------------------
class ReadOnlyPool implements DbPoolLike {
  constructor(private readonly client: Client) {}
  async connect(): Promise<DbClientLike> {
    return this.client as unknown as DbClientLike;
  }
  async query<R = Record<string, unknown>>(text: string, values?: readonly unknown[]) {
    return this.client.query(text, values as unknown[]) as unknown as {
      rows: R[];
      rowCount: number | null;
    };
  }
}

let outer: Client;

async function run(): Promise<void> {
  outer = new Client({ connectionString: DATABASE_URL });
  await outer.connect();

  // Hard read-only guarantee for the whole session.
  await outer.query('SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY');
  await outer.query('BEGIN');

  const deps = { db: new ReadOnlyPool(outer) as DbPoolLike };

  try {
    const hasMarkets = await outer.query(
      "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='markets'",
    );
    assert(hasMarkets.rows.length > 0, 'markets table is missing on the target database');

    // ---------------------------------------------------------------------
    console.log('\n(a) operational read returns exactly the 3 activated markets');
    // ---------------------------------------------------------------------
    await test('countOperationalMarkets == 3', async () => {
      assertEqual(await countOperationalMarkets(deps), 3, 'operational market count');
    });

    await test('listOperationalMarkets returns exactly 3 rows (not 272)', async () => {
      const markets = await listOperationalMarkets(deps);
      assertEqual(markets.length, 3, 'operational market count');
      assertEqual(markets.map((m) => m.marketNumber), [1, 2, 3], 'market numbers in order');
      assertEqual(
        markets.map((m) => m.marketNumberDisplay),
        ['001', '002', '003'],
        'zero-padded display numbers',
      );
      assertEqual(
        markets.map((m) => m.schoolName),
        ['Pillager High School', 'Pequot Lakes High School', 'Brainerd High School'],
        'school names from the activated universe rows',
      );
      assertEqual(
        markets.map((m) => m.state),
        ['PENETRATION', 'LAUNCH_READY', 'DEVELOPMENT'],
        'lifecycle states',
      );
      assertEqual(
        markets.map((m) => m.priority),
        ['TIER_1', 'TIER_2', 'TIER_3'],
        'priorities',
      );
      for (const market of markets) {
        assert(typeof market.ownerName === 'string' && market.ownerName.length > 0, `owner name resolved for market ${market.marketNumber}`);
        assert(typeof market.activatedAt === 'string' && market.activatedAt.length > 0, `activatedAt set for market ${market.marketNumber}`);
      }
    });

    await test('GET-by-number returns a Market for 1/2/3', async () => {
      const byOne = await getMarketByIdOrNumber(1, deps);
      assertEqual(byOne?.schoolName, 'Pillager High School', 'market 1 resolves to Pillager');
      const byThree = await getMarketByIdOrNumber(3, deps);
      assertEqual(byThree?.schoolName, 'Brainerd High School', 'market 3 resolves to Brainerd');
    });

    // ---------------------------------------------------------------------
    console.log('\n(b) a universe-only school returns nothing operational');
    // ---------------------------------------------------------------------
    await test('Academy of Holy Angels (id 98) exists in the universe and has no Market', async () => {
      const org = await outer.query('SELECT id, name FROM organizations WHERE id = 98');
      assertEqual(org.rows.length, 1, 'universe org 98 must exist');
      assertEqual(org.rows[0].name, 'Academy of Holy Angels', 'universe org 98 name');

      assertEqual(await findMarketByUniverseOrganization(98, deps), null, 'no market for org 98');
      assertEqual(await getMarketByIdOrNumber(98, deps), null, 'no market numbered/id 98');
    });

    await test('every one of the 269 unactivated organizations returns no Market', async () => {
      const ids: number[] = (
        await outer.query(
          `SELECT o.id FROM organizations o
            WHERE NOT EXISTS (SELECT 1 FROM markets m WHERE m.universe_organization_id = o.id)
            ORDER BY o.id`,
        )
      ).rows.map((r: { id: number }) => r.id);
      assertEqual(ids.length, 269, 'unactivated universe count');

      const leaked: number[] = [];
      for (const id of ids) {
        if ((await findMarketByUniverseOrganization(id, deps)) !== null) leaked.push(id);
      }
      assertEqual(leaked, [], 'universe-only organizations that leaked into an operational market');
    });

    await test('no universe-only id appears in the operational list', async () => {
      const markets = await listOperationalMarkets(deps);
      const operationalUniverseIds = new Set(markets.map((m) => m.universeOrganizationId));
      assertEqual([...operationalUniverseIds].sort((a, b) => a - b), [1, 2, 3], 'operational universe ids');
      const universeOnly: number[] = (
        await outer.query(
          `SELECT o.id FROM organizations o
            WHERE NOT EXISTS (SELECT 1 FROM markets m WHERE m.universe_organization_id = o.id)
            ORDER BY o.id`,
        )
      ).rows.map((r: { id: number }) => r.id);
      const intersection = universeOnly.filter((id) => operationalUniverseIds.has(id));
      assertEqual(intersection, [], 'universe-only ids present in the operational list');
    });

    // ---------------------------------------------------------------------
    console.log('\n(c) the auth boundary — 401 anonymous, 403 unauthorized');
    // ---------------------------------------------------------------------
    const app = Fastify();
    // Stand in for the global authMiddleware: it only PARSES identity and
    // attaches request.currentUser; the boundary does the rejecting.
    app.addHook('onRequest', async (request) => {
      const role = request.headers['x-test-role'];
      if (typeof role === 'string' && role.length > 0) {
        (request as unknown as { currentUser?: { id: number; role: string } }).currentUser = {
          id: 17,
          role,
        };
      }
    });
    await app.register(marketsRoutes, { prefix: '/api/v1/markets' });
    await app.ready();

    try {
      await test('anonymous GET /api/v1/markets -> 401', async () => {
        const res = await app.inject({ method: 'GET', url: '/api/v1/markets' });
        assertEqual(res.statusCode, 401, 'anonymous status');
      });

      await test('anonymous POST /api/v1/markets/activate -> 401', async () => {
        const res = await app.inject({ method: 'POST', url: '/api/v1/markets/activate', payload: {} });
        assertEqual(res.statusCode, 401, 'anonymous activate status');
      });

      await test('unrecognized role (403) GET /api/v1/markets -> 403', async () => {
        const res = await app.inject({
          method: 'GET',
          url: '/api/v1/markets',
          headers: { 'x-test-role': 'intern' },
        });
        assertEqual(res.statusCode, 403, 'unrecognized-role status');
      });

      await test('rep (tae) may NOT activate -> 403', async () => {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/markets/activate',
          headers: { 'x-test-role': 'tae' },
          payload: { universeOrganizationId: 98 },
        });
        assertEqual(res.statusCode, 403, 'rep activate status');
      });

      await test('authorized role (admin) GET /api/v1/markets -> 200 with exactly 3', async () => {
        const res = await app.inject({
          method: 'GET',
          url: '/api/v1/markets',
          headers: { 'x-test-role': 'admin' },
        });
        assertEqual(res.statusCode, 200, 'admin status');
        const body = res.json() as { markets: Array<{ marketNumber: number }>; count: number };
        assertEqual(body.count, 3, 'admin sees exactly 3 markets');
        assertEqual(body.markets.map((m) => m.marketNumber), [1, 2, 3], 'admin market numbers');
      });
    } finally {
      await app.close();
    }
  } finally {
    await outer.query('ROLLBACK').catch(() => {});
    await outer.end().catch(() => {});
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\nTUF Ops Wave 2 markets/auth proof: ${results.length - failed.length}/${results.length} passed`);
  if (failed.length > 0) process.exitCode = 1;
}

run().catch((error) => {
  console.error('Wave 2 proof suite aborted:', error?.message ?? error);
  process.exit(1);
});
