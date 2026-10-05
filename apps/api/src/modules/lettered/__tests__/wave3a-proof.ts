/**
 * TUF Ops 2.0 — Wave 3A proof suite: the LETTERED deployment lifecycle.
 *
 * Run with:
 *   DATABASE_URL=postgresql://postgres@127.0.0.1:55432/railway \
 *     npx tsx apps/api/src/modules/lettered/__tests__/wave3a-proof.ts
 *
 * Safety: all WRITES in this suite run inside ONE transaction that is ROLLED
 * BACK at the end — no test residue is left in the database. The committed
 * Pillager LIVE deployment (written by seed_lettered_2_0.js) is read, never
 * modified. The suite never touches the legacy database.
 *
 * Proves, against the live Postgres-r5VC 2.0 database:
 *   (a) a deployment can be created for Pillager (market 001);
 *   (b) an illegal lifecycle transition is REFUSED with a typed error;
 *   (c) a legal transition is applied and PERSISTED (re-read from the DB);
 *   (d) a deployment cannot be created for a universe-only organization;
 *   (e) per-market isolation: Pequot Lakes (002) and Brainerd (003) return
 *       their own (empty) sets, never Pillager's.
 * Plus: the seeded Pillager LIVE deployment is present and correct, and the
 * read routes are behind the approved auth boundary (401/403/200).
 */

import { Client } from 'pg';
import Fastify from 'fastify';

import {
  createLetteredDeployment,
  transitionLetteredDeployment,
} from '../lettered.service.js';
import {
  countLetteredDeploymentsForMarket,
  getLetteredDeploymentById,
  listLetteredDeploymentsForMarket,
} from '../lettered.read.service.js';
import { IllegalTransitionError, LetteredDeploymentError } from '../lettered.interface.js';
import type { DbClientLike, DbPoolLike } from '../lettered.interface.js';
import { letteredRoutes } from '../lettered.routes.js';
import { canTransitionLettered, LetteredState } from '@tuf/shared';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Refusing to run: set DATABASE_URL to the target 2.0 database.');
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Minimal harness (mirrors the Wave-2 runner)
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

/** A single-connection pool handed to the services (writes stay in the outer tx). */
class ClientPool implements DbPoolLike {
  constructor(private readonly client: Client) {}
  async connect(): Promise<DbClientLike> {
    return this.client as unknown as DbClientLike;
  }
  async query<R = Record<string, unknown>>(text: string, values?: readonly unknown[]) {
    return this.client.query(text, values as unknown[]) as unknown as { rows: R[]; rowCount: number | null };
  }
}

let outer: Client;

async function run(): Promise<void> {
  outer = new Client({ connectionString: DATABASE_URL });
  await outer.connect();
  await outer.query('BEGIN');

  const deps = { db: new ClientPool(outer) as DbPoolLike };

  try {
    const hasTable = await outer.query(
      "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='lettered_deployments'",
    );
    assert(hasTable.rows.length > 0, 'lettered_deployments table is missing on the target database');

    // ---------------------------------------------------------------------
    console.log('\n(0) the committed Pillager LIVE seed is present and correct');
    // ---------------------------------------------------------------------
    let seededId = 0;
    await test('a single SEED_LETTERED_2_0 deployment exists for Pillager at LIVE', async () => {
      const seed = await outer.query(
        `SELECT ld.id, ld.state, ld.owner_id, ld.next_action, ld.next_action_due,
                ld.drops_organization_id, ld.drops_collection_id, ld.storefront_url, m.market_number
           FROM lettered_deployments ld
           JOIN markets m ON m.id = ld.market_id
          WHERE m.market_number = 1 AND ld.source = 'SEED_LETTERED_2_0'`,
      );
      assertEqual(seed.rows.length, 1, 'seeded Pillager deployments');
      const row = seed.rows[0];
      seededId = Number(row.id);
      assertEqual(row.state, 'LIVE', 'seeded state');
      assert(Number(row.owner_id) > 0, 'seeded owner');
      assert(typeof row.next_action === 'string' && row.next_action.length > 0, 'seeded next_action');
      assert(row.next_action_due instanceof Date, 'seeded next_action_due');
      assert(typeof row.drops_collection_id === 'string' && row.drops_collection_id.length > 0, 'seeded drops_collection_id');
    });

    // ---------------------------------------------------------------------
    console.log('\n(a) a deployment can be created for Pillager (market 001)');
    // ---------------------------------------------------------------------
    let createdId = 0;
    await test('createLetteredDeployment(market 001) -> IDENTIFIED', async () => {
      const created = await createLetteredDeployment(
        {
          marketId: 1,
          ownerId: 17,
          priority: 'TIER_1',
          objective: 'Take a fresh Pillager LETTERED concept from identification to launch.',
          nextAction: 'Qualify the concept with the Pillager athletic director.',
          nextActionDue: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { id: 17, role: 'ADMIN' },
        deps,
      );
      createdId = created.id;
      assert(created.id > 0, 'created id');
      assertEqual(created.marketNumber, 1, 'created deployment market number');
      assertEqual(created.state, 'IDENTIFIED', 'created deployment starts at the entry state');
      assertEqual(created.ownerId, 17, 'created owner');
    });

    // ---------------------------------------------------------------------
    console.log('\n(b) an illegal lifecycle transition is REFUSED with a typed error');
    // ---------------------------------------------------------------------
    await test('IDENTIFIED -> LIVE is illegal and refused', async () => {
      assertEqual(canTransitionLettered(LetteredState.IDENTIFIED, LetteredState.LIVE), false, 'guard says IDENTIFIED->LIVE is illegal');
      let thrown: unknown = null;
      try {
        await transitionLetteredDeployment(createdId, 'LIVE', { id: 17 }, deps);
      } catch (error) {
        thrown = error;
      }
      assert(thrown instanceof IllegalTransitionError, 'expected IllegalTransitionError');
      const err = thrown as IllegalTransitionError;
      assertEqual(err.from, 'IDENTIFIED', 'refusal from-state');
      assertEqual(err.to, 'LIVE', 'refusal to-state');

      // Refusal must NOT have mutated the row.
      const after = await outer.query('SELECT state FROM lettered_deployments WHERE id = $1', [createdId]);
      assertEqual(after.rows[0].state, 'IDENTIFIED', 'state unchanged after refused transition');
    });

    // ---------------------------------------------------------------------
    console.log('\n(c) a legal transition is applied and PERSISTED');
    // ---------------------------------------------------------------------
    await test('IDENTIFIED -> QUALIFIED is applied and persisted', async () => {
      const moved = await transitionLetteredDeployment(createdId, 'QUALIFIED', { id: 17 }, deps);
      assertEqual(moved.state, 'QUALIFIED', 'returned state');

      // Re-read on a FRESH statement to prove it persisted in the database.
      const persisted = await outer.query('SELECT state, last_activity_at FROM lettered_deployments WHERE id = $1', [createdId]);
      assertEqual(persisted.rows[0].state, 'QUALIFIED', 'persisted state');
      assert(persisted.rows[0].last_activity_at instanceof Date, 'last_activity_at set on transition');

      const viaService = await getLetteredDeploymentById(createdId, deps);
      assertEqual(viaService?.state, 'QUALIFIED', 'read service agrees');
    });

    // ---------------------------------------------------------------------
    console.log('\n(d) a deployment cannot be created for a UNIVERSE-ONLY organization');
    // ---------------------------------------------------------------------
    await test('organization 98 is universe-only; creation is refused', async () => {
      const org = await outer.query('SELECT id, name FROM organizations WHERE id = 98');
      assertEqual(org.rows.length, 1, 'universe org 98 exists');
      const anyMarket = await outer.query('SELECT 1 FROM markets WHERE universe_organization_id = 98');
      assertEqual(anyMarket.rows.length, 0, 'org 98 has no market');

      let thrown: unknown = null;
      try {
        await createLetteredDeployment(
          {
            universeOrganizationId: 98,
            ownerId: 17,
            priority: 'TIER_1',
            objective: 'should never be created',
            nextAction: 'should never be created',
            nextActionDue: new Date().toISOString(),
          },
          { id: 17 },
          deps,
        );
      } catch (error) {
        thrown = error;
      }
      assert(thrown instanceof LetteredDeploymentError, 'expected LetteredDeploymentError');
      assertEqual((thrown as LetteredDeploymentError).reason, 'UNIVERSE_ONLY_ORGANIZATION', 'refusal reason');
    });

    // ---------------------------------------------------------------------
    console.log('\n(e) per-market isolation — Pequot (002) / Brainerd (003) are their own');
    // ---------------------------------------------------------------------
    await test('list(002) and list(003) are empty; list(001) holds its own deployments', async () => {
      const pequot = await listLetteredDeploymentsForMarket(2, deps);
      const brainerd = await listLetteredDeploymentsForMarket(3, deps);
      const pillager = await listLetteredDeploymentsForMarket(1, deps);

      assertEqual(pequot, [], 'Pequot Lakes 002 deployments');
      assertEqual(brainerd, [], 'Brainerd 003 deployments');
      assertEqual(await countLetteredDeploymentsForMarket(2, deps), 0, 'Pequot count');
      assertEqual(await countLetteredDeploymentsForMarket(3, deps), 0, 'Brainerd count');

      // Pillager holds the committed seed AND the freshly created test row.
      assert(pillager.length >= 2, `Pillager has its own deployments (got ${pillager.length})`);
      assert(pillager.every((d) => d.marketNumber === 1), 'every Pillager row is market 001');

      // No cross-leak: the created test deployment never appears in 002/003.
      const leak = [...pequot, ...brainerd].some((d) => d.id === createdId);
      assertEqual(leak, false, 'created Pillager row leaked into another market');
    });

    // ---------------------------------------------------------------------
    console.log('\n(f) the read routes sit behind the approved auth boundary');
    // ---------------------------------------------------------------------
    const app = Fastify();
    app.addHook('onRequest', async (request) => {
      const role = request.headers['x-test-role'];
      if (typeof role === 'string' && role.length > 0) {
        (request as unknown as { currentUser?: { id: number; role: string } }).currentUser = { id: 17, role };
      }
    });
    await app.register(letteredRoutes, { prefix: '/api/v1/lettered' });
    await app.ready();

    try {
      await test('anonymous GET /api/v1/lettered/markets/1 -> 401', async () => {
        const res = await app.inject({ method: 'GET', url: '/api/v1/lettered/markets/1' });
        assertEqual(res.statusCode, 401, 'anonymous status');
      });

      await test('unrecognized role GET /api/v1/lettered/markets/1 -> 403', async () => {
        const res = await app.inject({
          method: 'GET',
          url: '/api/v1/lettered/markets/1',
          headers: { 'x-test-role': 'intern' },
        });
        assertEqual(res.statusCode, 403, 'unauthorized status');
      });

      await test('rep (tae) GET /api/v1/lettered/markets/1 -> 200 with the seeded LIVE row', async () => {
        const res = await app.inject({
          method: 'GET',
          url: '/api/v1/lettered/markets/1',
          headers: { 'x-test-role': 'tae' },
        });
        assertEqual(res.statusCode, 200, 'rep read status');
        const body = res.json() as { deployments: Array<{ state: string }>; count: number };
        assert(body.count >= 1, 'rep sees the committed Pillager deployment');
        assert(body.deployments.some((d) => d.state === 'LIVE'), 'seeded LIVE deployment is returned');
      });

      await test(`GET /api/v1/lettered/${seededId} -> 200 for the seeded deployment`, async () => {
        const res = await app.inject({
          method: 'GET',
          url: `/api/v1/lettered/${seededId}`,
          headers: { 'x-test-role': 'admin' },
        });
        assertEqual(res.statusCode, 200, 'single-deployment status');
        const body = res.json() as { deployment: { id: number; state: string } };
        assertEqual(body.deployment.id, seededId, 'returned id');
        assertEqual(body.deployment.state, 'LIVE', 'returned state');
      });

      await test('GET /api/v1/lettered/markets/2 -> 200 with an empty (isolated) set', async () => {
        const res = await app.inject({
          method: 'GET',
          url: '/api/v1/lettered/markets/2',
          headers: { 'x-test-role': 'admin' },
        });
        assertEqual(res.statusCode, 200, 'Pequot read status');
        const body = res.json() as { deployments: unknown[]; count: number };
        assertEqual(body.count, 0, 'Pequot Lakes has no deployments');
      });
    } finally {
      await app.close();
    }
  } finally {
    await outer.query('ROLLBACK').catch(() => {});
    await outer.end().catch(() => {});
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\nTUF Ops Wave 3A LETTERED proof: ${results.length - failed.length}/${results.length} passed`);
  if (failed.length > 0) process.exitCode = 1;
}

run().catch((error) => {
  console.error('Wave 3A proof suite aborted:', error?.message ?? error);
  process.exit(1);
});
