/**
 * TUF Ops 2.0 — Wave 1 proof suite for the ACTIVATE MARKET gateway.
 *
 * Run with:
 *   DATABASE_URL=<target-with-markets-migration-applied> \
 *     npx tsx apps/api/src/modules/markets/__tests__/run.ts
 *
 * Safety: every fixture and every activation is executed inside ONE outer
 * transaction that is ROLLED BACK at the end. Nothing this suite writes
 * persists, so it is safe to point at the 2.0 database. (The concurrency probe
 * calls nextval(), which is non-transactional; the runner snapshots and restores
 * the sequence so allocation state is left exactly as it was.)
 *
 * Proves, per ACTIVATE_MARKET_SPEC §9:
 *   (a) activation fails without each of the six required fields,
 *   (b) the same school cannot be activated twice,
 *   (c) creating/importing an organization does NOT create a market,
 *   (d) creating an opportunity / order / activity cannot create or activate a market,
 *   plus: state = IDENTIFIED + exactly one initial Task + one ACTIVATION Activity,
 *         DB-level NOT NULL backstop (SQLSTATE 23502),
 *         concurrency-safe market_number allocation,
 *         and the single-INSERT-gateway source invariant.
 */

import { Client } from 'pg';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { activateMarket } from '../markets.service.js';
import { ActivationError } from '../markets.interface.js';
import type { DbClientLike, DbPoolLike } from '../markets.interface.js';

const DATABASE_URL = process.env.MARKETS_TEST_DATABASE_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Refusing to run: set DATABASE_URL (or MARKETS_TEST_DATABASE_URL) to the target database.');
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Minimal harness
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

async function expectActivationReason(fn: () => Promise<unknown>, reason: string): Promise<void> {
  try {
    await fn();
  } catch (error) {
    if (error instanceof ActivationError) {
      assertEqual(error.reason, reason, 'activation reason');
      return;
    }
    throw new Error(`expected ActivationError(${reason}), got ${(error as Error).message}`);
  }
  throw new Error(`expected ActivationError(${reason}), but activation succeeded`);
}

// ---------------------------------------------------------------------------
// Transaction-scoped pool: BEGIN/COMMIT/ROLLBACK become SAVEPOINTs on ONE
// connection, so the whole run is a single outer transaction we roll back.
// ---------------------------------------------------------------------------
let savepointSeq = 0;

class TxClient implements DbClientLike {
  private savepoint: string | null = null;
  constructor(private readonly outer: Client) {}

  async query<R = Record<string, unknown>>(text: string, values?: readonly unknown[]) {
    const keyword = text.trim().toUpperCase();
    if (keyword === 'BEGIN') {
      savepointSeq += 1;
      this.savepoint = `wave1_sp_${savepointSeq}`;
      await this.outer.query(`SAVEPOINT ${this.savepoint}`);
      return { rows: [] as R[], rowCount: null };
    }
    if (keyword === 'COMMIT') {
      if (this.savepoint) await this.outer.query(`RELEASE SAVEPOINT ${this.savepoint}`);
      return { rows: [] as R[], rowCount: null };
    }
    if (keyword === 'ROLLBACK') {
      if (this.savepoint) await this.outer.query(`ROLLBACK TO SAVEPOINT ${this.savepoint}`);
      return { rows: [] as R[], rowCount: null };
    }
    return (await this.outer.query(text, values as unknown[])) as unknown as {
      rows: R[];
      rowCount: number | null;
    };
  }

  release(): void {
    /* shared connection — never released until the run ends */
  }
}

class TxPool implements DbPoolLike {
  constructor(private readonly outer: Client) {}
  async connect(): Promise<DbClientLike> {
    return new TxClient(this.outer);
  }
}

/** Runs a statement that is EXPECTED to fail without poisoning the outer tx. */
async function expectPgError(sql: string, values: unknown[], expectedCode: string, label: string) {
  savepointSeq += 1;
  const sp = `wave1_err_${savepointSeq}`;
  await outer.query(`SAVEPOINT ${sp}`);
  try {
    await outer.query(sql, values);
    throw new Error(`${label}: expected SQLSTATE ${expectedCode}, but the statement succeeded`);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code !== expectedCode) {
      throw new Error(`${label}: expected SQLSTATE ${expectedCode}, got ${code ?? error}`);
    }
  } finally {
    await outer.query(`ROLLBACK TO SAVEPOINT ${sp}`);
  }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
let fixtureSeq = 0;

async function requiredColumns(table: string): Promise<string[]> {
  const r = await outer.query(
    `SELECT column_name FROM information_schema.columns
      WHERE table_schema='public' AND table_name=$1
        AND is_nullable='NO' AND column_default IS NULL AND is_identity='NO'
        AND column_name <> 'id'
      ORDER BY ordinal_position`,
    [table],
  );
  return r.rows.map((row: any) => row.column_name);
}

async function ownerId(): Promise<number> {
  const r = await outer.query(
    "SELECT id FROM users ORDER BY CASE WHEN role = 'ADMIN' THEN 0 ELSE 1 END, id LIMIT 1",
  );
  if (r.rows.length === 0) throw new Error('no users row available; run migrations first');
  return r.rows[0].id;
}

async function newOrg(label: string): Promise<number> {
  fixtureSeq += 1;
  const name = `Wave1 ${label} ${Date.now()}-${fixtureSeq}`;
  const required = await requiredColumns('organizations');
  const provided: Record<string, unknown> = { name, state: 'MN', status: 'active', created_by: 1, updated_by: 1 };
  const missing = required.filter((column) => !(column in provided));
  assert(missing.length === 0, `organizations has unsupported required columns: ${missing.join(', ')}`);

  const columns = Object.keys(provided);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const r = await outer.query(
    `INSERT INTO organizations (${columns.join(', ')}) VALUES (${placeholders}) RETURNING id`,
    columns.map((column) => provided[column]),
  );
  return r.rows[0].id;
}

let outer: Client;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function run(): Promise<void> {
  outer = new Client({ connectionString: DATABASE_URL });
  await outer.connect();
  const txPool = new TxPool(outer);
  const deps = { db: txPool as DbPoolLike };

  const oid = await ownerId();

  // Ensure the migration is present before doing anything.
  const hasMarkets = await outer.query(
    "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='markets'",
  );
  if (hasMarkets.rows.length === 0) {
    throw new Error('markets table is missing on the target database; apply the 1900000060000 migration first');
  }

  await outer.query('BEGIN');

  try {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    console.log('\n(a) required-field contract');
    await test('missing universeOrganizationId -> UNKNOWN_UNIVERSE_REFERENCE', async () => {
      await expectActivationReason(
        () => activateMarket({ ownerId: oid, priority: 'TIER_1', objective: 'x', nextAction: 'y', nextActionDue: future }, { id: oid }, deps),
        'UNKNOWN_UNIVERSE_REFERENCE',
      );
    });
    await test('bad universeOrganizationId -> UNKNOWN_UNIVERSE_REFERENCE', async () => {
      await expectActivationReason(
        () => activateMarket({ universeOrganizationId: 2147483000, ownerId: oid, priority: 'TIER_1', objective: 'x', nextAction: 'y', nextActionDue: future }, { id: oid }, deps),
        'UNKNOWN_UNIVERSE_REFERENCE',
      );
    });
    await test('missing ownerId -> MISSING_OWNER', async () => {
      const org = await newOrg('noowner');
      await expectActivationReason(
        () => activateMarket({ universeOrganizationId: org, priority: 'TIER_1', objective: 'x', nextAction: 'y', nextActionDue: future }, { id: oid }, deps),
        'MISSING_OWNER',
      );
    });
    await test('unknown ownerId -> MISSING_OWNER', async () => {
      const org = await newOrg('badowner');
      await expectActivationReason(
        () => activateMarket({ universeOrganizationId: org, ownerId: 2147483000, priority: 'TIER_1', objective: 'x', nextAction: 'y', nextActionDue: future }, { id: oid }, deps),
        'MISSING_OWNER',
      );
    });
    await test('blank objective -> MISSING_OBJECTIVE', async () => {
      const org = await newOrg('noobjective');
      await expectActivationReason(
        () => activateMarket({ universeOrganizationId: org, ownerId: oid, priority: 'TIER_1', objective: '   ', nextAction: 'y', nextActionDue: future }, { id: oid }, deps),
        'MISSING_OBJECTIVE',
      );
    });
    await test('blank nextAction -> MISSING_NEXT_ACTION', async () => {
      const org = await newOrg('noaction');
      await expectActivationReason(
        () => activateMarket({ universeOrganizationId: org, ownerId: oid, priority: 'TIER_1', objective: 'x', nextAction: '  ', nextActionDue: future }, { id: oid }, deps),
        'MISSING_NEXT_ACTION',
      );
    });
    await test('missing/invalid nextActionDue -> MISSING_NEXT_ACTION_DUE', async () => {
      const org = await newOrg('nodue');
      await expectActivationReason(
        () => activateMarket({ universeOrganizationId: org, ownerId: oid, priority: 'TIER_1', objective: 'x', nextAction: 'y' }, { id: oid }, deps),
        'MISSING_NEXT_ACTION_DUE',
      );
      await expectActivationReason(
        () => activateMarket({ universeOrganizationId: org, ownerId: oid, priority: 'TIER_1', objective: 'x', nextAction: 'y', nextActionDue: 'not-a-date' }, { id: oid }, deps),
        'MISSING_NEXT_ACTION_DUE',
      );
    });
    await test('unknown priority -> INVALID_PRIORITY', async () => {
      const org = await newOrg('badprio');
      await expectActivationReason(
        () => activateMarket({ universeOrganizationId: org, ownerId: oid, priority: 'URGENT', objective: 'x', nextAction: 'y', nextActionDue: future }, { id: oid }, deps),
        'INVALID_PRIORITY',
      );
    });
    await test('unauthenticated actor -> NOT_AUTHORISED', async () => {
      const org = await newOrg('noactor');
      await expectActivationReason(
        () => activateMarket({ universeOrganizationId: org, ownerId: oid, priority: 'TIER_1', objective: 'x', nextAction: 'y', nextActionDue: future }, {}, deps),
        'NOT_AUTHORISED',
      );
    });

    console.log('\n(b) one activation per school');
    await test('the same school cannot be activated twice', async () => {
      const org = await newOrg('dup');
      const input = { universeOrganizationId: org, ownerId: oid, priority: 'TIER_2', objective: 'First', nextAction: 'Do the thing', nextActionDue: future };
      const first = await activateMarket(input, { id: oid }, deps);
      assert(first.market.state === 'IDENTIFIED', 'fresh market must be IDENTIFIED');
      await expectActivationReason(() => activateMarket({ ...input, objective: 'Second' }, { id: oid }, deps), 'SCHOOL_ALREADY_ACTIVATED');
    });

    console.log('\n(c) importing an organization is inert');
    await test('creating an organization does NOT create a market', async () => {
      const before = await outer.query('SELECT count(*)::int AS n FROM markets');
      const org = await newOrg('inert');
      const after = await outer.query('SELECT count(*)::int AS n FROM markets');
      const linked = await outer.query('SELECT 1 FROM markets WHERE universe_organization_id = $1', [org]);
      assertEqual(after.rows[0].n, before.rows[0].n, 'markets count must not change when an org is created');
      assertEqual(linked.rows.length, 0, 'a newly imported org must not be a market');
    });

    console.log('\n(d) opportunity / order / activity creation is inert');
    await test('creating an opportunity, order and activity cannot create or activate a market', async () => {
      const before = await outer.query('SELECT count(*)::int AS n FROM markets');
      const org = await newOrg('ops');

      const opp = await outer.query(
        `INSERT INTO opportunities (name, organization_id, status, stage, created_by, updated_by)
         VALUES ($1, $2, 'open', 'CLOSED_WON', $3, $3) RETURNING id`,
        [`Wave1 opp ${Date.now()}`, org, oid],
      );
      await outer.query(
        `INSERT INTO activities (type, organization_id, opportunity_id, description, created_by)
         VALUES ('NOTE', $1, $2, 'wave1 activity', $3)`,
        [org, opp.rows[0].id, oid],
      );
      await outer.query(
        `INSERT INTO orders (opportunity_id, organization_id, deal_type, status)
         VALUES ($1, $2, 'UNIFORM', 'CREATED')`,
        [opp.rows[0].id, org],
      );

      const after = await outer.query('SELECT count(*)::int AS n FROM markets');
      const linked = await outer.query('SELECT 1 FROM markets WHERE universe_organization_id = $1', [org]);
      assertEqual(after.rows[0].n, before.rows[0].n, 'markets count must not change');
      assertEqual(linked.rows.length, 0, 'opportunity/order/activity creation must not activate a market');
    });

    console.log('\n(e) what a successful activation produces');
    await test('activation creates one market + one task + one activity at IDENTIFIED', async () => {
      const org = await newOrg('happy');
      const due = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const { market, warnings } = await activateMarket(
        { universeOrganizationId: org, ownerId: oid, priority: 'TIER_1', objective: 'Open the account', nextAction: 'Call the AD', nextActionDue: due },
        { id: oid },
        deps,
      );
      assert(market.state === 'IDENTIFIED', `state must be IDENTIFIED, got ${market.state}`);
      assert(typeof market.activatedAt === 'string' && market.activatedAt.length > 0, 'activatedAt must be set');
      assert(market.marketNumber > 0, 'marketNumber must be allocated');
      assertEqual(warnings, [], 'future due date must not warn');

      const tasks = await outer.query('SELECT count(*)::int AS n FROM market_tasks WHERE market_id = $1', [market.id]);
      const acts = await outer.query('SELECT count(*)::int AS n FROM market_activities WHERE market_id = $1', [market.id]);
      assertEqual(tasks.rows[0].n, 1, 'exactly one initial Task');
      assertEqual(acts.rows[0].n, 1, 'exactly one ACTIVATION Activity');
    });

    console.log('\n(f) database-level backstops');
    await test('direct INSERT omitting next_action fails with NOT NULL (23502)', async () => {
      const org = await newOrg('notnull');
      await expectPgError(
        `INSERT INTO markets (universe_organization_id, owner_id, priority, objective, next_action_due)
         VALUES ($1, $2, 'TIER_1', 'x', now())`,
        [org, oid],
        '23502',
        'next_action NOT NULL proof',
      );
    });

    await test('UNIQUE(market_number) backstops a duplicate allocation', async () => {
      const org1 = await newOrg('dupn1');
      const org2 = await newOrg('dupn2');
      const a = await activateMarket({ universeOrganizationId: org1, ownerId: oid, priority: 'TIER_1', objective: 'a', nextAction: 'a', nextActionDue: future }, { id: oid }, deps);
      await expectPgError(
        `INSERT INTO markets (market_number, universe_organization_id, owner_id, priority, objective, next_action, next_action_due)
         VALUES ($1, $2, $3, 'TIER_1', 'b', 'b', now())`,
        [a.market.marketNumber, org2, oid],
        '23505',
        'market_number UNIQUE proof',
      );
    });

    console.log('\n(g) concurrency-safe market_number allocation');
    await test('N parallel nextval calls yield N distinct numbers', async () => {
      const seqBefore = await outer.query("SELECT last_value, is_called FROM market_number_seq");
      const N = 24;
      const clients: Client[] = [];
      try {
        for (let i = 0; i < N; i += 1) {
          const c = new Client({ connectionString: DATABASE_URL });
          await c.connect();
          clients.push(c);
        }
        const values = await Promise.all(
          clients.map((c) => c.query("SELECT nextval('market_number_seq')::int AS n")),
        );
        const numbers = values.map((r) => r.rows[0].n);
        assertEqual(new Set(numbers).size, N, 'all concurrently allocated numbers must be distinct');
      } finally {
        for (const c of clients) await c.end().catch(() => {});
        const { last_value, is_called } = seqBefore.rows[0];
        await outer.query("SELECT setval('market_number_seq', $1, $2)", [last_value, is_called]);
      }
    });

    console.log('\n(h) the single gateway');
    await test('no source path inserts into markets except activateMarket (and the Commander-gated seed)', async () => {
      const repoRoot = process.cwd();
      const allow = new Set([
        path.join('apps', 'api', 'src', 'modules', 'markets', 'markets.service.ts'),
        path.join('packages', 'database', 'seed_markets_2_0.js'),
      ]);
      const offenders: string[] = [];
      const pattern = /INSERT\s+INTO\s+markets/i;

      const walk = (dir: string): void => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '__tests__' || entry.name.startsWith('.')) continue;
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walk(full);
          } else if (/\.(ts|js)$/.test(entry.name)) {
            const relative = path.relative(repoRoot, full);
            if (allow.has(relative)) continue;
            if (pattern.test(fs.readFileSync(full, 'utf8'))) offenders.push(relative);
          }
        }
      };
      walk(path.join(repoRoot, 'apps', 'api', 'src'));
      walk(path.join(repoRoot, 'packages', 'database'));
      assertEqual(offenders, [], 'unexpected INSERT INTO markets sites');
    });
  } finally {
    await outer.query('ROLLBACK').catch(() => {});
    await outer.end().catch(() => {});
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\nTUF Ops markets activation tests: ${results.length - failed.length}/${results.length} passed`);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error('markets activation suite aborted:', error?.message ?? error);
  process.exit(1);
});
