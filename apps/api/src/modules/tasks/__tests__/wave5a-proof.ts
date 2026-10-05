/**
 * TUF Ops 2.0 — Wave 5A proof suite: deterministic task engine + COMMAND.
 *
 * Run with (from the repo root):
 *   DATABASE_URL=postgresql://postgres@127.0.0.1:55432/railway \
 *     npx tsx apps/api/src/modules/tasks/__tests__/wave5a-proof.ts
 *
 * Safety: every service-level fixture and transition runs inside ONE transaction
 * that is ROLLED BACK. Nothing this suite writes persists. Route-level cases read
 * only committed data.
 *
 * Proves, for the Wave-5A surface:
 *   (a) a Market state transition generates the CORRECT next task, and the pure
 *       generator is DETERMINISTIC (same input -> same output);
 *   (b) running the SAME transition twice does NOT duplicate the task — the
 *       idempotency key + partial UNIQUE index make it a database guarantee;
 *   (c) COMMAND returns the three seeded markets' REAL obligations, correctly
 *       ordered overdue -> today -> upcoming, each carrying the full chain
 *       STATE -> OBJECTIVE -> OWNER -> NEXT ACTION -> DEADLINE -> BLOCKER;
 *   (d) a Market with no obligations yields an HONEST EMPTY result (no
 *       fabricated row, no invented count);
 *   (e) there is NO AI/model call anywhere in the engine — a SOURCE-LEVEL
 *       assertion (no AI tokens; imports limited to an allowlist).
 */

import { Client } from 'pg';
import Fastify from 'fastify';
import fs from 'node:fs';
import path from 'node:path';

import {
  determineNextTask,
  taskTemplateFor,
  bucketRank,
} from '../tasks.engine.js';
import {
  applyMarketTransition,
  generateTaskForDeployment,
  persistNextTask,
} from '../tasks.service.js';
import { IllegalTransitionError, TaskEngineError } from '../tasks.interface.js';
import { getCommandBoard, getCommandForMarket } from '../command.read.service.js';
import { commandRoutes } from '../command.routes.js';
import type { DbClientLike, DbPoolLike } from '../../markets/markets.interface.js';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Refusing to run: set DATABASE_URL to the target 2.0 database.');
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Minimal harness (mirrors the Wave-2 / Wave-3A / Wave-4A runners)
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
    return this.client.query(text, values as unknown[]) as unknown as {
      rows: R[];
      rowCount: number | null;
    };
  }
}

let outer: Client;
let savepointSeq = 0;

/** Runs a statement that is EXPECTED to fail without poisoning the outer tx. */
async function expectPgError(sql: string, values: unknown[], expectedCode: string, label: string) {
  savepointSeq += 1;
  const sp = `wave5a_err_${savepointSeq}`;
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
// Fixtures (created inside the rolled-back transaction)
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
  return Number(r.rows[0].id);
}

async function newOrg(label: string): Promise<number> {
  fixtureSeq += 1;
  const name = `Wave5A ${label} ${Date.now()}-${fixtureSeq}`;
  const required = await requiredColumns('organizations');
  const provided: Record<string, unknown> = {
    name,
    state: 'MN',
    status: 'active',
    created_by: 1,
    updated_by: 1,
  };
  const missing = required.filter((column) => !(column in provided));
  assert(missing.length === 0, `organizations has unsupported required columns: ${missing.join(', ')}`);
  const columns = Object.keys(provided);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const r = await outer.query(
    `INSERT INTO organizations (${columns.join(', ')}) VALUES (${placeholders}) RETURNING id`,
    columns.map((column) => provided[column]),
  );
  return Number(r.rows[0].id);
}

/**
 * Create a scratch Market with an EXPLICIT market_number (no sequence side
 * effect) inside the rolled-back transaction.
 */
async function newMarket(label: string, marketNumber: number, state: string, oid: number): Promise<number> {
  const org = await newOrg(label);
  const r = await outer.query(
    `INSERT INTO markets (
       market_number, universe_organization_id, owner_id, priority, objective,
       next_action, next_action_due, state, activated_at, source, created_by, updated_by
     ) VALUES ($1, $2, $3, 'TIER_1', $4, $5, now() + interval '5 days', $6, now(), 'WAVE5A_PROOF', $3, $3)
     RETURNING id, market_number`,
    [marketNumber, org, oid, `Proof market ${label}`, `Proof next action for ${label}`, state],
  );
  return Number(r.rows[0].id);
}

// ---------------------------------------------------------------------------
// Source-level engine files (for the no-AI assertion)
// ---------------------------------------------------------------------------
const HERE = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

function engineFile(name: string): string {
  const candidates = [
    path.resolve(HERE, '..', name),
    path.resolve(process.cwd(), 'apps/api/src/modules/tasks', name),
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error(`engine source not found: ${name}`);
}

const ENGINE_FILES = [
  'tasks.interface.ts',
  'tasks.lookup.ts',
  'tasks.engine.ts',
  'tasks.service.ts',
  'command.read.service.ts',
];
const ROUTE_FILES = ['command.controller.ts', 'command.routes.ts'];

async function run(): Promise<void> {
  outer = new Client({ connectionString: DATABASE_URL });
  await outer.connect();
  await outer.query('BEGIN');

  const pool = new ClientPool(outer) as DbPoolLike;
  const deps = { db: pool };

  try {
    const cols = await outer.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_schema='public' AND table_name='market_tasks'
          AND column_name IN ('task_key','priority')`,
    );
    assert(cols.rows.length === 2, 'market_tasks is missing the Wave-5A columns (task_key/priority) — run the migration');

    const oid = await ownerId();

    // =====================================================================
    console.log('\n(a) a Market transition GENERATES the correct next task, deterministically');
    // =====================================================================
    await test('the pure generator is deterministic and matches the declarative table', async () => {
      const now = new Date('2026-10-05T12:00:00.000Z');
      const s1 = determineNextTask('MARKET', 'LAUNCH_READY', { now });
      const s2 = determineNextTask('MARKET', 'LAUNCH_READY', { now });
      assert(s1 !== null, 'LAUNCH_READY must generate a task');
      assertEqual(s1, s2, 'same input must yield the same output (determinism)');

      const template = taskTemplateFor('MARKET', 'LAUNCH_READY');
      assert(template !== null, 'LAUNCH_READY template exists');
      assertEqual(s1!.taskKey, 'MARKET:LAUNCH_READY', 'deterministic idempotency key');
      assertEqual(s1!.title, template!.action, 'task title is the declarative action');
      assertEqual(s1!.priority, template!.priority, 'task priority comes from the table');
      assertEqual(
        s1!.dueAt.toISOString(),
        new Date(now.getTime() + template!.dueInDays * 86_400_000).toISOString(),
        'due date = now + template.dueInDays',
      );

      // Terminal states generate no task; unknown states are refused, never guessed.
      assertEqual(determineNextTask('MARKET', 'KILLED', { now }), null, 'KILLED generates no task');
      let threw: unknown = null;
      try {
        determineNextTask('MARKET', 'NOT_A_STATE', { now });
      } catch (error) {
        threw = error;
      }
      assert(threw instanceof TaskEngineError, 'unknown state must throw TaskEngineError');
      assertEqual((threw as TaskEngineError).reason, 'UNKNOWN_STATE', 'unknown-state reason');
    });

    await test('an illegal Market transition is REFUSED and mutates nothing', async () => {
      // Brainerd (market 003) is seeded at DEVELOPMENT.
      const before = await outer.query('SELECT state FROM markets WHERE market_number = 3');
      assertEqual(before.rows[0].state, 'DEVELOPMENT', 'seeded Brainerd state');
      let threw: unknown = null;
      try {
        await applyMarketTransition(3, 'MATURE', { id: oid }, deps);
      } catch (error) {
        threw = error;
      }
      assert(threw instanceof IllegalTransitionError, 'expected IllegalTransitionError');
      const after = await outer.query('SELECT state FROM markets WHERE market_number = 3');
      assertEqual(after.rows[0].state, 'DEVELOPMENT', 'state unchanged after refused transition');
    });

    await test('DEVELOPMENT -> LAUNCH_READY generates + persists the correct task', async () => {
      const now = new Date('2026-10-05T12:00:00.000Z');
      const expected = determineNextTask('MARKET', 'LAUNCH_READY', { now })!;
      const result = await applyMarketTransition(3, 'LAUNCH_READY', { id: oid }, { db: pool, now });

      assertEqual(result.fromState, 'DEVELOPMENT', 'from-state');
      assertEqual(result.toState, 'LAUNCH_READY', 'to-state');
      assert(result.task !== null, 'a task was generated');
      assertEqual(result.task!.created, true, 'the task was newly created');
      assertEqual(result.task!.taskKey, 'MARKET:LAUNCH_READY', 'generated task key');
      assertEqual(result.task!.title, expected.title, 'generated task title matches the table');
      assertEqual(result.task!.dueAt, expected.dueAt.toISOString(), 'generated due date');

      // Persisted on a fresh statement.
      const m = await outer.query(
        'SELECT state, next_action, next_action_due FROM markets WHERE market_number = 3',
      );
      assertEqual(m.rows[0].state, 'LAUNCH_READY', 'persisted market state');
      assertEqual(m.rows[0].next_action, expected.title, 'market next_action aligned to the task');
      assertEqual(
        new Date(m.rows[0].next_action_due).toISOString(),
        expected.dueAt.toISOString(),
        'market next_action_due aligned to the task',
      );
      const t = await outer.query(
        "SELECT title, state, task_key FROM market_tasks WHERE market_id = 3 AND task_key = 'MARKET:LAUNCH_READY'",
      );
      assertEqual(t.rows.length, 1, 'exactly one generated task row');
      assertEqual(t.rows[0].state, 'OPEN', 'generated task is OPEN');
    });

    await test('a LETTERED state resolves to its own deterministic task', async () => {
      const now = new Date('2026-10-05T12:00:00.000Z');
      const spec = determineNextTask('LETTERED', 'LIVE', { deploymentId: 42, now });
      assert(spec !== null, 'LETTERED LIVE generates a task');
      assertEqual(spec!.taskKey, 'LETTERED:42:LIVE', 'deployment-scoped key');
      assertEqual(spec!.title, taskTemplateFor('LETTERED', 'LIVE')!.action, 'LETTERED LIVE title');
      assertEqual(determineNextTask('LETTERED', 'KILLED', { deploymentId: 42, now }), null, 'killed deployment generates nothing');
    });

    // =====================================================================
    console.log('\n(b) running the SAME transition twice is IDEMPOTENT (no duplicate)');
    // =====================================================================
    await test('DEVELOPMENT -> BLOCKED twice (with a resume between) creates ONE task', async () => {
      const mid = await newMarket('idem', 9003, 'DEVELOPMENT', oid);
      const now = new Date('2026-10-05T12:00:00.000Z');

      // Run 1: DEVELOPMENT -> BLOCKED  (generates MARKET:BLOCKED, still OPEN)
      const run1 = await applyMarketTransition(mid, 'BLOCKED', { id: oid }, { db: pool, now });
      assertEqual(run1.task!.created, true, 'first BLOCKED task created');

      // Legal resume so the SAME transition can legitimately be reached again.
      await applyMarketTransition(mid, 'DEVELOPMENT', { id: oid }, { db: pool, now });

      // Run 2: DEVELOPMENT -> BLOCKED again — the earlier MARKET:BLOCKED is STILL
      // OPEN, so generation must DEDUPLICATE.
      const run2 = await applyMarketTransition(mid, 'BLOCKED', { id: oid }, { db: pool, now });
      assertEqual(run2.task!.created, false, 'second identical transition did NOT create a row');
      assertEqual(run2.task!.taskId, run1.task!.taskId, 'same task row is reused');

      const openBlocked = await outer.query(
        "SELECT count(*)::int AS n FROM market_tasks WHERE market_id = $1 AND task_key = 'MARKET:BLOCKED' AND state = 'OPEN'",
        [mid],
      );
      assertEqual(openBlocked.rows[0].n, 1, 'exactly ONE OPEN MARKET:BLOCKED task');
    });

    await test('the database REFUSES a second OPEN task with the same key (partial UNIQUE)', async () => {
      // Independent of the service: a raw duplicate OPEN insert must fail 23505.
      const mid = await newMarket('uniq', 9005, 'DEVELOPMENT', oid);
      await outer.query(
        `INSERT INTO market_tasks (market_id, title, due_at, state, source, task_key, priority, created_by)
         VALUES ($1, 'raw', now(), 'OPEN', 'WAVE5A_PROOF', 'MARKET:RAW', 'TIER_1', $2)`,
        [mid, oid],
      );
      await expectPgError(
        `INSERT INTO market_tasks (market_id, title, due_at, state, source, task_key, priority, created_by)
         VALUES ($1, 'raw-dup', now(), 'OPEN', 'WAVE5A_PROOF', 'MARKET:RAW', 'TIER_1', $2)`,
        [mid, oid],
        '23505',
        'partial UNIQUE OPEN task_key proof',
      );
      // A DONE task with the same key is allowed (a later, genuinely new cycle).
      await outer.query(
        `INSERT INTO market_tasks (market_id, title, due_at, state, source, task_key, priority, created_by, completed_at)
         VALUES ($1, 'raw-done', now(), 'DONE', 'WAVE5A_PROOF', 'MARKET:RAW', 'TIER_1', $2, now())`,
        [mid, oid],
      );
    });

    await test('persistNextTask is idempotent against an already-created spec', async () => {
      const mid = await newMarket('persist', 9006, 'DEVELOPMENT', oid);
      const now = new Date('2026-10-05T12:00:00.000Z');
      const spec = determineNextTask('MARKET', 'DEVELOPMENT', { now })!;
      const a = await persistNextTask(outer as unknown as DbClientLike, { marketId: mid, spec, actorId: oid });
      const b = await persistNextTask(outer as unknown as DbClientLike, { marketId: mid, spec, actorId: oid });
      assertEqual(a.created, true, 'first persist creates');
      assertEqual(b.created, false, 'second persist dedupes');
      assertEqual(b.taskId, a.taskId, 'same row reused');
    });

    // =====================================================================
    console.log('\n(c) COMMAND returns the seeded markets\' real obligations, ordered');
    // =====================================================================
    await test('board is ordered overdue -> today -> upcoming with the full chain', async () => {
      const now = new Date();
      const startOfTomorrow = new Date(now.getTime());
      startOfTomorrow.setHours(24, 0, 0, 0);
      const todayDue = new Date(Math.min(now.getTime() + 3_600_000, startOfTomorrow.getTime() - 60_000));
      const overdueDue = new Date(now.getTime() - 2 * 86_400_000);
      const upcomingDue = new Date(now.getTime() + 20 * 86_400_000);

      const seedTask = async (marketNumber: number, due: Date) => {
        await outer.query(
          `INSERT INTO market_tasks (market_id, title, due_at, state, source, task_key, priority, created_by)
           SELECT id, $2, $3, 'OPEN', 'WAVE5A_PROOF', NULL, 'TIER_1', $4
             FROM markets WHERE market_number = $1`,
          [marketNumber, `Proof obligation for market ${marketNumber}`, due.toISOString(), oid],
        );
      };
      await seedTask(1, overdueDue); // Pillager 001 -> OVERDUE
      await seedTask(2, todayDue); //   Pequot   002 -> TODAY
      await seedTask(3, upcomingDue); // Brainerd 003 -> UPCOMING

      const board = await getCommandBoard(deps);
      assert(!board.empty, 'board is not empty');
      assert(board.count >= 3, `board has the three obligations (got ${board.count})`);

      const seenMarkets = new Set(board.items.map((i) => i.marketNumber));
      for (const n of [1, 2, 3]) assert(seenMarkets.has(n), `board includes seeded market ${n}`);

      // Ordering: bucket ranks must be non-decreasing; within a bucket, due dates ascend.
      const ranks = board.items.map((i) => bucketRank(i.bucket));
      for (let i = 1; i < ranks.length; i += 1) {
        assert(ranks[i] >= ranks[i - 1], `bucket order broken at index ${i}`);
      }
      for (let i = 1; i < board.items.length; i += 1) {
        if (board.items[i].bucket === board.items[i - 1].bucket) {
          assert(
            new Date(board.items[i].dueAt).getTime() >= new Date(board.items[i - 1].dueAt).getTime(),
            `due date order broken within bucket at index ${i}`,
          );
        }
      }
      assertEqual(board.items[0].bucket, 'OVERDUE', 'first obligation is overdue');
      const bucketsPresent = new Set(board.items.map((i) => i.bucket));
      assert(bucketsPresent.has('OVERDUE') && bucketsPresent.has('TODAY') && bucketsPresent.has('UPCOMING'), 'all three buckets present');
      assertEqual(
        board.buckets.overdue + board.buckets.today + board.buckets.upcoming,
        board.count,
        'bucket counts sum to the board count',
      );

      // The full chain resolves on every obligation.
      for (const item of board.items) {
        assert(typeof item.marketState === 'string' && item.marketState.length > 0, 'STATE resolves');
        assert(typeof item.objective === 'string' && item.objective.length > 0, 'OBJECTIVE resolves');
        assert(Number.isInteger(item.ownerId) && item.ownerId > 0, 'OWNER resolves');
        assert(typeof item.nextAction === 'string' && item.nextAction.length > 0, 'NEXT ACTION resolves');
        assert(!Number.isNaN(new Date(item.nextActionDue).getTime()), 'DEADLINE resolves');
        assert(item.blocker === null || typeof item.blocker === 'string', 'BLOCKER is a value or explicitly null');
        assert(Number.isInteger(item.marketNumber), 'market number present');
      }

      // The earliest item is the real overdue obligation we inserted for market 001.
      const first = board.items[0];
      assertEqual(first.marketNumber, 1, 'overdue obligation belongs to market 001');
      assert(new Date(first.dueAt).getTime() < now.getTime(), 'overdue due date is in the past');
    });

    // =====================================================================
    console.log('\n(d) a Market with NO obligations yields an HONEST EMPTY result');
    // =====================================================================
    await test('an obligation-free Market returns empty:true with count 0', async () => {
      const emptyMarket = await newMarket('empty', 9004, 'IDENTIFIED', oid);
      const tasksForMarket = await outer.query(
        'SELECT count(*)::int AS n FROM market_tasks WHERE market_id = $1',
        [emptyMarket],
      );
      assertEqual(tasksForMarket.rows[0].n, 0, 'scratch market really has no tasks');

      const board = await getCommandForMarket(9004, deps);
      assertEqual(board.empty, true, 'empty board is honest');
      assertEqual(board.count, 0, 'count is 0');
      assertEqual(board.items, [], 'no fabricated rows');
      assertEqual(board.buckets, { overdue: 0, today: 0, upcoming: 0 }, 'no fabricated counts');
      assert(board.items.every((i) => i.marketId !== emptyMarket), 'nothing invented for the empty market');
    });

    await test('a Market whose only task is DONE also returns honest empty', async () => {
      const mid = await newMarket('doneonly', 9007, 'IDENTIFIED', oid);
      await outer.query(
        `INSERT INTO market_tasks (market_id, title, due_at, state, source, task_key, priority, created_by, completed_at)
         VALUES ($1, 'done thing', now() - interval '1 day', 'DONE', 'WAVE5A_PROOF', 'MARKET:DONEONLY', 'TIER_1', $2, now())`,
        [mid, oid],
      );
      const board = await getCommandForMarket(9007, deps);
      assertEqual(board.empty, true, 'no OPEN tasks -> honest empty');
      assertEqual(board.count, 0, 'count is 0');
    });

    // =====================================================================
    console.log('\n(e) the engine contains NO AI/model call (SOURCE-LEVEL assertion)');
    // =====================================================================
    await test('no AI/model/network token appears in any engine source file', async () => {
      const forbidden = [
        'openai', 'anthropic', 'claude', 'gpt-4', 'gpt-3', 'gpt-', 'llm', 'langchain',
        'cohere', 'gemini', 'mistral', 'huggingface', 'openrouter', 'ollama',
        '@tuf/ai', 'generatetext', 'chat.completions', 'embeddings', 'prompt(',
        'axios', 'node-fetch', 'undici', 'http.request', 'https.request', 'fetch(',
      ];
      const allFiles = [...ENGINE_FILES, ...ROUTE_FILES];
      for (const name of allFiles) {
        const source = fs.readFileSync(engineFile(name), 'utf8').toLowerCase();
        for (const token of forbidden) {
          assert(!source.includes(token), `forbidden AI/network token '${token}' in ${name}`);
        }
      }
    });

    await test('engine imports are limited to the allowlist (no AI/HTTP SDKs)', async () => {
      const allow = /^(@tuf\/shared|@packages\/database|\.)/;
      const specRe = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]/g;
      for (const name of ENGINE_FILES) {
        const source = fs.readFileSync(engineFile(name), 'utf8');
        let m: RegExpExecArray | null;
        while ((m = specRe.exec(source)) !== null) {
          assert(allow.test(m[1]), `non-allowlisted import '${m[1]}' in ${name}`);
        }
      }
    });

    await test('the pure generator contains no non-determinism (no Math.random)', async () => {
      for (const name of ['tasks.engine.ts', 'tasks.lookup.ts']) {
        const source = fs.readFileSync(engineFile(name), 'utf8');
        assert(!source.includes('Math.random'), `${name} must not use Math.random`);
      }
    });

    // =====================================================================
    console.log('\n(f) the COMMAND read routes sit behind the approved auth boundary');
    // =====================================================================
    const app = Fastify();
    app.addHook('onRequest', async (request) => {
      const role = request.headers['x-test-role'];
      if (typeof role === 'string' && role.length > 0) {
        (request as unknown as { currentUser?: { id: number; role: string } }).currentUser = { id: oid, role };
      }
    });
    await app.register(commandRoutes, { prefix: '/api/v1/command' });
    await app.ready();
    try {
      await test('anonymous GET /api/v1/command -> 401', async () => {
        const res = await app.inject({ method: 'GET', url: '/api/v1/command' });
        assertEqual(res.statusCode, 401, 'anonymous status');
      });
      await test('unrecognized role GET /api/v1/command -> 403', async () => {
        const res = await app.inject({ method: 'GET', url: '/api/v1/command', headers: { 'x-test-role': 'intern' } });
        assertEqual(res.statusCode, 403, 'unauthorized status');
      });
      await test('rep GET /api/v1/command -> 200 with the committed board', async () => {
        const res = await app.inject({ method: 'GET', url: '/api/v1/command', headers: { 'x-test-role': 'tae' } });
        assertEqual(res.statusCode, 200, 'rep read status');
        const body = res.json() as { command: { count: number; items: Array<{ marketNumber: number }>; empty: boolean } };
        assert(body.command.count >= 3, 'committed board holds the three seeded obligations');
        assert(body.command.empty === false, 'committed board is not empty');
      });
      await test('GET /api/v1/command/markets/2 -> 200', async () => {
        const res = await app.inject({ method: 'GET', url: '/api/v1/command/markets/2', headers: { 'x-test-role': 'admin' } });
        assertEqual(res.statusCode, 200, 'market-scoped read status');
      });
      await test('GET /api/v1/command/markets/999999 -> 200 honest empty (never a 500)', async () => {
        const res = await app.inject({ method: 'GET', url: '/api/v1/command/markets/999999', headers: { 'x-test-role': 'admin' } });
        assertEqual(res.statusCode, 200, 'unknown market read status');
        const body = res.json() as { command: { empty: boolean; count: number } };
        assertEqual(body.command.empty, true, 'unknown market -> honest empty');
        assertEqual(body.command.count, 0, 'unknown market -> count 0');
      });
    } finally {
      await app.close();
    }
  } finally {
    await outer.query('ROLLBACK').catch(() => {});
    await outer.end().catch(() => {});
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\nTUF Ops Wave 5A task-engine + COMMAND proof: ${results.length - failed.length}/${results.length} passed`);
  if (failed.length > 0) process.exitCode = 1;
}

run().catch((error) => {
  console.error('Wave 5A proof suite aborted:', error?.message ?? error);
  process.exit(1);
});
