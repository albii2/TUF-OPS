/**
 * TUF Ops 2.0 — Wave 4A proof suite: READ-ONLY Drops OS integration.
 *
 * Run with (from the repo root):
 *   DATABASE_URL=postgresql://postgres@127.0.0.1:55432/railway \
 *     npx tsx apps/api/src/modules/integration/__tests__/wave4a-proof.ts
 *
 * Safety: the service-level cases run inside ONE transaction that is rolled
 * back; NOTHING is committed. The route-level cases read only committed data.
 *
 * Proves, for the Wave-4A surface:
 *   (a) the Drops client contains NO write verb — a SOURCE-LEVEL assertion on
 *       `drops.client.ts`: no other method token, every method literal is GET;
 *   (b) a metric snapshot can be stored and re-read for Pillager's deployment,
 *       keyed by (drops_organization_id, drops_collection_id);
 *   (c) when Drops is UNREACHABLE the reader serves the CACHED values, marks
 *       them STALE, does NOT advance last_sync_at, and NEVER fabricates a 0 or
 *       blanks the screen — a never-synced key yields an explicit "no data yet";
 *   (d) no table in the 2.0 database mirrors Drops consumer order line items.
 *
 * HONESTY: live Drops credentials/endpoints are NOT available in this
 * environment. Cases (b)/(c) therefore use an INJECTED FAKE TRANSPORT and a
 * RECORDED FIXTURE. LIVE Drops verification is BLOCKED (reported at the end).
 */

import { Client } from 'pg';
import Fastify from 'fastify';
import fs from 'node:fs';
import path from 'node:path';

import {
  getMarketCommerceMetrics,
  refreshMarketMetric,
  resolveDeploymentForMarket,
  type MarketMetricDeps,
} from '../drops.metrics.service.js';
import {
  readCollectionSummary,
  projectCollectionSummary,
  type DropsClientConfig,
} from '../drops.client.js';
import type { DropsTransport, DropsHttpGetRequest } from '../drops.interface.js';
import { integrationRoutes } from '../drops.routes.js';
import type { DbClientLike, DbPoolLike } from '../../markets/markets.interface.js';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Refusing to run: set DATABASE_URL to the target 2.0 database.');
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Minimal harness (mirrors the Wave-2 / Wave-3A runners)
// ---------------------------------------------------------------------------
interface CaseResult { name: string; ok: boolean; error?: string; }
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

class ClientPool implements DbPoolLike {
  constructor(private readonly client: Client) {}
  async connect(): Promise<DbClientLike> {
    return this.client as unknown as DbClientLike;
  }
  async query<R = Record<string, unknown>>(text: string, values?: readonly unknown[]) {
    return this.client.query(text, values as unknown[]) as unknown as { rows: R[]; rowCount: number | null };
  }
}

function firstExisting(candidates: string[]): string {
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error(`source file not found; tried:\n  ${candidates.join('\n  ')}`);
}

const HERE = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
const CLIENT_SRC = firstExisting([
  path.resolve(HERE, '../drops.client.ts'),
  path.resolve(process.cwd(), 'apps/api/src/modules/integration/drops.client.ts'),
]);
const ROUTES_SRC = firstExisting([
  path.resolve(HERE, '../drops.routes.ts'),
  path.resolve(process.cwd(), 'apps/api/src/modules/integration/drops.routes.ts'),
]);

// --- The recorded fixture (a plausible Drops summary; NOT a live reading) ---
const FIXTURE_ORG = 'pillager-high-school';
const FIXTURE_COLLECTION = 'pillager-lettered-2026';
const FIXTURE = {
  storeStatus: 'LIVE',
  lifecycleStatus: 'PUBLISHED',
  publishedAt: '2026-08-15T14:00:00.000Z',
  storeUrl: '/schools/pillager-high-school/pillager-lettered-2026',
  orderCount: 7,
  revenue: 1234.5,
  aov: 176.36,
  firstOrderAt: '2026-08-16T09:30:00.000Z',
  utmSummary: { source: 'facebook', medium: 'social', campaign: 'pillager-launch', attributedOrderCount: 4 },
  referralSummary: { topReferrers: [{ referrer: 'direct', count: 3 }, { referrer: 'instagram', count: 2 }] },
  fulfillmentSummary: { unitsOrdered: 12, unitsFulfilled: 5, unitsPending: 7, fulfillmentStatus: 'PARTIAL' },
  // A field OUTSIDE the frozen §4 set — the adapter must DISCARD it.
  secretExtraField: 'must-not-persist',
  lineItems: [{ sku: 'FORBIDDEN', qty: 3 }],
};

const FAKE_CONFIG: DropsClientConfig = {
  baseUrl: 'https://drops.invalid',
  credential: null,
  authHeader: 'Authorization',
  authScheme: 'Bearer',
  timeoutMs: 1_000,
  retryMax: 3,
  collectionPath: '/organizations/{organizationId}/collections/{collectionId}',
};

let lastRequestUrl = '';
const successTransport: DropsTransport = async (request: DropsHttpGetRequest) => {
  lastRequestUrl = request.url;
  return { status: 200, body: FIXTURE };
};
const failingTransport: DropsTransport = async () => {
  const err = new Error('ECONNREFUSED 127.0.0.1:1');
  throw err;
};
const noSleep = async () => {};

let outer: Client;

async function run(): Promise<void> {
  outer = new Client({ connectionString: DATABASE_URL });
  await outer.connect();
  await outer.query('BEGIN');

  const pool = new ClientPool(outer) as DbPoolLike;

  try {
    const hasTable = await outer.query(
      "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='market_metrics'",
    );
    assert(hasTable.rows.length > 0, 'market_metrics table is missing on the target database (run the migration)');

    // =====================================================================
    console.log('\n(a) the Drops client is READ-ONLY at the SOURCE level');
    // =====================================================================
    const clientSource = fs.readFileSync(CLIENT_SRC, 'utf8');
    const routesSource = fs.readFileSync(ROUTES_SRC, 'utf8');

    await test('drops.client.ts contains NO write-verb token', async () => {
      const matches = clientSource.match(/\b(POST|PUT|PATCH|DELETE)\b/g) ?? [];
      assertEqual(matches, [], 'write-verb tokens in drops.client.ts');
      for (const token of ['.post(', '.put(', '.patch(', '.delete(', 'sendBeacon', 'XMLHttpRequest']) {
        assert(!clientSource.includes(token), `forbidden mutation token present: ${token}`);
      }
    });

    await test('every HTTP method literal in drops.client.ts is GET', async () => {
      const methods: string[] = [];
      const re = /method\s*:\s*['"]([A-Za-z]+)['"]/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(clientSource)) !== null) methods.push(m[1]);
      assert(methods.length >= 1, 'expected at least one method literal');
      assertEqual([...new Set(methods)], ['GET'], 'distinct HTTP method literals');
    });

    await test('the client performs I/O through exactly one fetch() call site', async () => {
      const fetchCalls = clientSource.match(/\bfetch\s*\(/g) ?? [];
      assertEqual(fetchCalls.length, 1, 'fetch() call sites in drops.client.ts');
    });

    await test('the integration has NO mutation route (only server.get)', async () => {
      for (const token of ['server.post(', 'server.put(', 'server.patch(', 'server.delete(']) {
        assert(!routesSource.includes(token), `mutation route present: ${token}`);
      }
      const gets = routesSource.match(/server\.get\s*\(/g) ?? [];
      assert(gets.length === 2, `expected 2 GET routes, found ${gets.length}`);
    });

    // =====================================================================
    console.log('\n(b) a snapshot is stored + re-read for Pillager (001), keyed correctly');
    // =====================================================================
    let deploymentId = 0;
    const resolved = await resolveDeploymentForMarket(1, { db: pool });
    await test('Pillager (001) resolves to its LETTERED deployment Drops key', async () => {
      assert(resolved !== null, 'Pillager deployment with Drops refs must resolve');
      deploymentId = resolved!.letteredDeploymentId;
      assertEqual(resolved!.marketNumber, 1, 'resolved market number');
      assertEqual(resolved!.ref.dropsOrganizationId, FIXTURE_ORG, 'resolved drops organization id');
      assertEqual(resolved!.ref.dropsCollectionId, FIXTURE_COLLECTION, 'resolved drops collection id');
    });

    const depsOk: MarketMetricDeps = { db: pool, transport: successTransport, config: FAKE_CONFIG, sleep: noSleep };
    let storedLastSync = '';
    await test('refreshMarketMetric stores the snapshot and advances last_sync_at', async () => {
      const refresh = await refreshMarketMetric(resolved!, depsOk);
      assert(refresh.ok, `refresh should succeed: ${JSON.stringify(refresh)}`);
      assertEqual(refresh.reason, 'OK', 'refresh reason');
      assertEqual(refresh.stored, true, 'stored flag');
      assert(typeof refresh.lastSyncAt === 'string' && refresh.lastSyncAt.length > 0, 'last_sync_at set');
      storedLastSync = refresh.lastSyncAt!;

      assertEqual(lastRequestUrl, 'https://drops.invalid/organizations/pillager-high-school/collections/pillager-lettered-2026', 'GET url');
    });

    await test('the stored row is keyed by (drops_organization_id, drops_collection_id)', async () => {
      const row = await outer.query(
        `SELECT drops_organization_id, drops_collection_id, order_count, revenue, aov
           FROM market_metrics WHERE drops_organization_id = $1 AND drops_collection_id = $2`,
        [FIXTURE_ORG, FIXTURE_COLLECTION],
      );
      assertEqual(row.rows.length, 1, 'rows for the Pillager Drops key');
      assertEqual(Number(row.rows[0].order_count), FIXTURE.orderCount, 'stored order_count');
      assertEqual(Number(row.rows[0].revenue), FIXTURE.revenue, 'stored revenue');

      // A DIFFERENT key returns nothing — proving keying is on the Drops pair.
      const other = await outer.query(
        'SELECT 1 FROM market_metrics WHERE drops_collection_id = $1',
        ['some-other-collection'],
      );
      assertEqual(other.rows.length, 0, 'rows for a different collection key');
    });

    await test('the snapshot is re-read and matches the fixture; extras were discarded', async () => {
      const view = await getMarketCommerceMetrics(1, { db: pool }, {});
      assertEqual(view.hasData, true, 'hasData');
      assertEqual(view.stale, false, 'freshly synced snapshot is not stale');
      assertEqual(view.noDataYet, false, 'noDataYet');
      assertEqual(view.orderCount, FIXTURE.orderCount, 'orderCount');
      assertEqual(view.revenue, FIXTURE.revenue, 'revenue');
      assertEqual(view.aov, FIXTURE.aov, 'aov');
      assertEqual(view.aovProvenance, 'REPORTED', 'aov provenance');
      assertEqual(view.storeStatus, FIXTURE.storeStatus, 'storeStatus');
      assertEqual(view.dropsCollectionId, FIXTURE_COLLECTION, 'drops collection in view');
      assertEqual(view.lastSyncAt, storedLastSync, 'lastSyncAt matches the stored value');

      // The extras the fixture carried must NOT exist on the row.
      const cols = await outer.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name='market_metrics'",
      );
      const names = cols.rows.map((r: any) => String(r.column_name));
      assert(!names.includes('line_items'), 'line_items column must not exist');
      assert(!names.includes('secret_extra_field'), 'discarded extra field must not persist');
    });

    // =====================================================================
    console.log('\n(c) Drops UNREACHABLE -> cached values, STALE-marked, never fabricated');
    // =====================================================================
    const depsFail: MarketMetricDeps = { db: pool, transport: failingTransport, config: FAKE_CONFIG, sleep: noSleep };

    await test('a failed refresh does NOT advance last_sync_at and does not throw', async () => {
      const before = await outer.query('SELECT last_sync_at FROM market_metrics WHERE drops_collection_id = $1', [FIXTURE_COLLECTION]);
      const refresh = await refreshMarketMetric(resolved!, depsFail);
      assertEqual(refresh.ok, false, 'refresh must fail');
      assertEqual(refresh.reason, 'DROPS_READ_FAILED', 'failure reason');
      assertEqual(refresh.failure?.reason, 'NETWORK', 'typed failure reason');
      const after = await outer.query('SELECT last_sync_at FROM market_metrics WHERE drops_collection_id = $1', [FIXTURE_COLLECTION]);
      assertEqual(
        new Date(after.rows[0].last_sync_at).toISOString(),
        new Date(before.rows[0].last_sync_at).toISOString(),
        'last_sync_at unchanged after a failed poll',
      );
    });

    await test('the reader serves the CACHED values marked STALE (no blank, no fabrication)', async () => {
      const view = await getMarketCommerceMetrics(1, depsFail, { refresh: true });
      assertEqual(view.hasData, true, 'cached data is still served');
      assertEqual(view.stale, true, 'stale flag');
      assertEqual(view.staleReason, 'DROPS_UNREACHABLE', 'stale reason');
      assertEqual(view.refreshError, 'NETWORK', 'typed refresh error surfaced');
      assertEqual(view.orderCount, FIXTURE.orderCount, 'cached orderCount preserved');
      assertEqual(view.revenue, FIXTURE.revenue, 'cached revenue preserved');
      assertEqual(view.aov, FIXTURE.aov, 'cached aov preserved');
      assert(typeof view.lastSyncAt === 'string' && view.lastSyncAt.length > 0, 'lastSyncAt present');

      // Forbidden outcomes: a fabricated 0 where a real number is known, or blank.
      assert(view.orderCount !== 0 && view.revenue !== 0, 'must not degrade known values to 0');
    });

    await test('a never-synced key renders "no data yet" — NEVER 0', async () => {
      // Market 002 Pequot Lakes has no LETTERED deployment / no cache row.
      const view = await getMarketCommerceMetrics(2, { db: pool }, {});
      assertEqual(view.hasData, false, 'hasData');
      assertEqual(view.noDataYet, true, 'noDataYet');
      assertEqual(view.orderCount, null, 'orderCount null (not 0)');
      assertEqual(view.revenue, null, 'revenue null (not 0)');
      assertEqual(view.aov, null, 'aov null (not 0)');
      assertEqual(view.lastSyncAt, null, 'lastSyncAt null');
    });

    await test('unconfigured Drops yields a typed NOT_CONFIGURED failure, not data', async () => {
      const read = await readCollectionSummary(
        { dropsOrganizationId: FIXTURE_ORG, dropsCollectionId: FIXTURE_COLLECTION },
        { config: { ...FAKE_CONFIG, baseUrl: null }, transport: successTransport },
      );
      assertEqual(read.ok, false, 'unconfigured read must fail');
      if (!read.ok) assertEqual(read.failure.reason, 'NOT_CONFIGURED', 'typed reason');
    });

    await test('order_count = 0 ⇒ AOV is NULL; a missing AOV is DERIVED when possible', () => {
      const zero = projectCollectionSummary({ orderCount: 0, revenue: 0, aov: 0 });
      assertEqual(zero?.orderCount, 0, 'zero orders count');
      assertEqual(zero?.aov, null, 'AOV must be null when order_count = 0');

      const derived = projectCollectionSummary({ orderCount: 5, revenue: 100 });
      assertEqual(derived?.aov, 20, 'derived AOV = revenue / order_count');
      assertEqual(derived?.aovProvenance, 'DERIVED', 'derived provenance');
    });

    // =====================================================================
    console.log('\n(d) no table mirrors Drops consumer order line items');
    // =====================================================================
    await test('only the deployment and its summary cache carry Drops references; no order mirror', async () => {
      const dropsCols = await outer.query(
        "SELECT table_name, column_name FROM information_schema.columns WHERE column_name ILIKE '%drops%' ORDER BY table_name",
      );
      const tables = [...new Set(dropsCols.rows.map((r: any) => String(r.table_name)))].sort();
      // The deployment stores the 3 R8 references; the cache stores the same 3 as
      // its key. NO other table references Drops, and neither is an order table.
      assertEqual(tables, ['lettered_deployments', 'market_metrics'], 'tables carrying drops_* columns');
      const refCols = [...new Set(dropsCols.rows.map((r: any) => String(r.column_name)))].sort();
      assertEqual(
        refCols,
        ['drops_collection_id', 'drops_drop_id', 'drops_organization_id'],
        'the 3 R8 Drops references, nothing else',
      );
    });

    await test('market_metrics carries NO line-item / product / customer / payment columns', async () => {
      const cols = await outer.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name='market_metrics'",
      );
      const names = cols.rows.map((r: any) => String(r.column_name));
      const forbidden = /line_?item|order_?item|\bsku\b|product|variant|\bcart\b|customer|payment|checkout/i;
      const offending = names.filter((n) => forbidden.test(n));
      assertEqual(offending, [], 'line-item-like columns on market_metrics');
      // Sanity: the summary aggregates ARE present.
      for (const required of ['order_count', 'revenue', 'aov', 'last_sync_at']) {
        assert(names.includes(required), `summary column missing: ${required}`);
      }
    });

    await test('no table has BOTH a Drops reference AND a line-item column', async () => {
      const rows = await outer.query(
        `SELECT c.table_name,
                bool_or(c.column_name ILIKE '%drops%') AS has_drops,
                bool_or(c.column_name ~* 'line_?item|order_?item|sku|product|variant|cart|customer|payment') AS has_line_item
           FROM information_schema.columns c
          WHERE c.table_schema = 'public'
          GROUP BY c.table_name
         HAVING bool_or(c.column_name ILIKE '%drops%')
             OR bool_or(c.column_name ~* 'line_?item|order_?item|sku|product|variant|cart|customer|payment')`,
      );
      const mirrors = rows.rows.filter((r: any) => r.has_drops && r.has_line_item).map((r: any) => r.table_name);
      assertEqual(mirrors, [], 'tables that both reference Drops and carry line-item columns');
    });

    await test('list tables and classify any order-shaped table as legacy 1.0 (not Drops)', async () => {
      const all = await outer.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name",
      );
      const names = all.rows.map((r: any) => String(r.table_name));
      const orderish = names.filter((n) => /order|line|product|cart/i.test(n));
      console.log(`         total tables: ${names.length}`);
      console.log(`         order/product-shaped tables: ${orderish.join(', ') || '(none)'}`);
      console.log('         2.0 Drops tables: market_metrics, lettered_deployments (references only)');

      // The legacy order-shaped tables must carry zero Drops references.
      for (const t of orderish) {
        const dropsRefs = await outer.query(
          "SELECT column_name FROM information_schema.columns WHERE table_name=$1 AND column_name ILIKE '%drops%'",
          [t],
        );
        assertEqual(dropsRefs.rows.length, 0, `${t} must carry no Drops reference (legacy 1.0 institutional domain)`);
      }
    });

    // =====================================================================
    console.log('\n(e) read routes sit behind the approved auth boundary');
    // =====================================================================
    const app = Fastify();
    app.addHook('onRequest', async (request) => {
      const role = request.headers['x-test-role'];
      if (typeof role === 'string' && role.length > 0) {
        (request as unknown as { currentUser?: { id: number; role: string } }).currentUser = { id: 17, role };
      }
    });
    await app.register(integrationRoutes, { prefix: '/api/v1/integration' });
    await app.ready();

    try {
      await test('anonymous GET /api/v1/integration/markets/1/commerce -> 401', async () => {
        const res = await app.inject({ method: 'GET', url: '/api/v1/integration/markets/1/commerce' });
        assertEqual(res.statusCode, 401, 'anonymous status');
      });

      await test('unrecognized role -> 403', async () => {
        const res = await app.inject({
          method: 'GET',
          url: '/api/v1/integration/markets/1/commerce',
          headers: { 'x-test-role': 'intern' },
        });
        assertEqual(res.statusCode, 403, 'unauthorized status');
      });

      await test('rep (tae) -> 200 with an explicit "no data yet" (never a fabricated 0)', async () => {
        const res = await app.inject({
          method: 'GET',
          url: '/api/v1/integration/markets/1/commerce',
          headers: { 'x-test-role': 'tae' },
        });
        assertEqual(res.statusCode, 200, 'authorized status');
        const body = res.json() as { commerce: { hasData: boolean; noDataYet: boolean; orderCount: number | null; dropsOrganizationId: string | null } };
        assertEqual(body.commerce.hasData, false, 'no committed cache row on the app pool');
        assertEqual(body.commerce.noDataYet, true, 'explicit no-data-yet state');
        assertEqual(body.commerce.orderCount, null, 'orderCount is null, never 0');
        assertEqual(body.commerce.dropsOrganizationId, FIXTURE_ORG, 'the deployment Drops key is echoed');
      });

      await test('GET /api/v1/integration/deployments/:id/commerce -> 200 for the seeded deployment', async () => {
        const res = await app.inject({
          method: 'GET',
          url: `/api/v1/integration/deployments/${deploymentId}/commerce`,
          headers: { 'x-test-role': 'admin' },
        });
        assertEqual(res.statusCode, 200, 'seeded deployment status');
      });

      await test('there is NO mutation route: POST to the commerce path -> 404/405', async () => {
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/integration/markets/1/commerce',
          headers: { 'x-test-role': 'admin' },
          payload: {},
        });
        assert(res.statusCode === 404 || res.statusCode === 405, `expected 404/405, got ${res.statusCode}`);
      });
    } finally {
      await app.close();
    }
  } finally {
    await outer.query('ROLLBACK').catch(() => {});
    await outer.end().catch(() => {});
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\nTUF Ops Wave 4A Drops (read-only) proof: ${results.length - failed.length}/${results.length} passed`);

  // --- Live verification status (honest) ---------------------------------
  const liveBase = process.env.DROPS_BASE_URL?.trim();
  const liveCredential = (process.env.DROPS_API_KEY ?? process.env.DROPS_AUTH_SCHEME ?? '').toString().trim();
  console.log('\nLIVE DROPS VERIFICATION: ' + (liveBase && liveCredential ? 'CONFIGURED (not exercised by this fixture suite)' : 'BLOCKED'));
  console.log(`  DROPS_BASE_URL present: ${Boolean(liveBase)}`);
  console.log(`  Drops machine credential present: ${Boolean(liveCredential)}`);
  console.log('  This suite proves the integration with a RECORDED FIXTURE + INJECTED FAKE TRANSPORT.');
  console.log('  No live Drops endpoint/token was available, so no live commerce numbers are claimed.');

  if (failed.length > 0) process.exitCode = 1;
}

run().catch((error) => {
  console.error('Wave 4A proof suite aborted:', error?.message ?? error);
  process.exit(1);
});
