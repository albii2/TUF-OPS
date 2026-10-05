/**
 * TUF Ops 2.0 — the task engine WRITE service (Wave 5A).
 *
 * Applies a Market lifecycle transition and, deterministically, materialises the
 * next task from the declarative lookup table. Generation is IDEMPOTENT: the
 * insert carries a deterministic `task_key` and the database enforces a PARTIAL
 * UNIQUE index on (market_id, task_key) for OPEN tasks, so re-running the same
 * transition does NOT duplicate the task. A later, genuinely new cycle (once the
 * previous task is DONE) may create a fresh task.
 *
 * There is NO AI/model call anywhere here — the task text comes verbatim from
 * `tasks.lookup.ts`.
 */

import { canTransitionMarket } from '@tuf/shared';
import { determineNextTask } from './tasks.engine.js';
import {
  IllegalTransitionError,
  TaskEngineError,
  type ApplyMarketTransitionDeps,
  type DbClientLike,
  type DbPoolLike,
  type GeneratedTask,
  type MarketTransitionResult,
  type NextTaskSpec,
  type TaskActor,
} from './tasks.interface.js';

// ---------------------------------------------------------------------------
// DB plumbing (mirrors the Wave-2A/3A read-service pattern; lazy `pg` import)
// ---------------------------------------------------------------------------

async function resolveDb(deps: { db?: DbPoolLike }): Promise<DbPoolLike> {
  if (deps.db) return deps.db;
  const mod = await import('@packages/database');
  return mod.pool as unknown as DbPoolLike;
}

async function withClient<R>(db: DbPoolLike, fn: (client: DbClientLike) => Promise<R>): Promise<R> {
  if (typeof db.connect === 'function') {
    const client = await db.connect();
    try {
      return await fn(client);
    } finally {
      client.release?.();
    }
  }
  return fn(db as unknown as DbClientLike);
}

function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number.parseInt(value.trim(), 10);
    return parsed > 0 ? parsed : null;
  }
  return null;
}

function requireActorId(actor: TaskActor): number {
  const id = toPositiveInt(actor?.id);
  if (id === null) {
    throw new TaskEngineError('MISSING_ACTOR', 'an authenticated actor is required to generate a task');
  }
  return id;
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return String(value);
}

/**
 * Idempotently persist one task for `spec` on the given client.
 *
 * The partial-unique index `market_tasks_open_task_key_uniq` guarantees that at
 * most one OPEN task exists per (market_id, task_key). A re-run therefore hits
 * `ON CONFLICT ... DO NOTHING` and returns the EXISTING task with
 * `created:false` — never a duplicate row.
 */
export async function persistNextTask(
  client: DbClientLike,
  params: { marketId: number; spec: NextTaskSpec; source?: string; actorId: number },
): Promise<GeneratedTask> {
  const { marketId, spec, actorId } = params;
  const source = params.source ?? 'TASK_ENGINE';

  const inserted = await client.query<{ id: number }>(
    `INSERT INTO market_tasks (market_id, title, due_at, state, source, task_key, priority, created_by)
     VALUES ($1, $2, $3, 'OPEN', $4, $5, $6, $7)
     ON CONFLICT (market_id, task_key) WHERE task_key IS NOT NULL AND state = 'OPEN'
     DO NOTHING
     RETURNING id`,
    [marketId, spec.title, spec.dueAt.toISOString(), source, spec.taskKey, spec.priority, actorId],
  );

  if (inserted.rows.length > 0) {
    return {
      taskId: Number(inserted.rows[0].id),
      taskKey: spec.taskKey,
      title: spec.title,
      dueAt: spec.dueAt.toISOString(),
      priority: String(spec.priority),
      created: true,
    };
  }

  // Conflict: the deterministic task for this transition already exists (OPEN).
  const existing = await client.query<{ id: number; title: string; due_at: unknown; priority: string | null }>(
    `SELECT id, title, due_at, priority
       FROM market_tasks
      WHERE market_id = $1 AND task_key = $2 AND state = 'OPEN'
      ORDER BY id
      LIMIT 1`,
    [marketId, spec.taskKey],
  );
  if (existing.rows.length === 0) {
    // Should be unreachable: a conflict was reported but no OPEN row is visible.
    throw new TaskEngineError('UNKNOWN_STATE', `open task for key ${spec.taskKey} vanished`);
  }
  const row = existing.rows[0];
  return {
    taskId: Number(row.id),
    taskKey: spec.taskKey,
    title: row.title,
    dueAt: toIso(row.due_at),
    priority: row.priority ?? String(spec.priority),
    created: false,
  };
}

/**
 * Apply a Market lifecycle transition and materialise its next task,
 * deterministically and idempotently. Also keeps the Market's own
 * `next_action`/`next_action_due` aligned with the generated task, so
 * "every active Market resolves to state -> objective -> owner -> next action ->
 * deadline -> blocker" stays true after the transition.
 *
 * An illegal transition is REFUSED with `IllegalTransitionError` and mutates
 * nothing.
 */
export async function applyMarketTransition(
  marketId: number,
  toState: string,
  actor: TaskActor,
  deps: ApplyMarketTransitionDeps = {},
): Promise<MarketTransitionResult> {
  const target = Number(marketId);
  if (!Number.isInteger(target) || target <= 0) {
    throw new TaskEngineError('UNKNOWN_MARKET', 'a positive market id is required');
  }
  const actorId = requireActorId(actor);
  const now = deps.now ?? new Date();

  const db = await resolveDb(deps);
  return withClient(db, async (client) => {
    const current = await client.query<{ id: number; market_number: number; state: string }>(
      'SELECT id, market_number, state FROM markets WHERE id = $1 FOR UPDATE',
      [target],
    );
    if (current.rows.length === 0) {
      throw new TaskEngineError('UNKNOWN_MARKET', `no market with id ${target}`);
    }

    const fromState = String(current.rows[0].state);
    const marketNumber = Number(current.rows[0].market_number);

    // The canonical state machine is the SOLE authority on legality.
    if (!canTransitionMarket(fromState as never, toState as never)) {
      throw new IllegalTransitionError(fromState, toState);
    }

    // Deterministic next task from the declarative table (null for KILLED).
    const spec = determineNextTask('MARKET', toState, { now });

    if (spec) {
      await client.query(
        `UPDATE markets
            SET state = $2,
                next_action = $3,
                next_action_due = $4,
                updated_at = now(),
                updated_by = $5
          WHERE id = $1`,
        [target, toState, spec.title, spec.dueAt.toISOString(), actorId],
      );
    } else {
      await client.query(
        `UPDATE markets
            SET state = $2, updated_at = now(), updated_by = $3
          WHERE id = $1`,
        [target, toState, actorId],
      );
    }

    const task = spec
      ? await persistNextTask(client, { marketId: target, spec, source: 'TASK_ENGINE', actorId })
      : null;

    return { marketId: target, marketNumber, fromState, toState, task };
  });
}

/**
 * Deterministically generate (idempotently) the task for a LETTERED deployment
 * state. The deployment's canonical transition legality is owned by the
 * `lettered` module; this function only guarantees a valid, canonical state and
 * the idempotent task. Available for the LETTERED surface to call on transition.
 */
export async function generateTaskForDeployment(
  deploymentId: number,
  toState: string,
  actor: TaskActor,
  deps: ApplyMarketTransitionDeps = {},
): Promise<GeneratedTask | null> {
  const id = Number(deploymentId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new TaskEngineError('UNKNOWN_DEPLOYMENT', 'a positive deployment id is required');
  }
  const actorId = requireActorId(actor);
  const now = deps.now ?? new Date();

  const db = await resolveDb(deps);
  return withClient(db, async (client) => {
    const found = await client.query<{ id: number; market_id: number }>(
      'SELECT id, market_id FROM lettered_deployments WHERE id = $1',
      [id],
    );
    if (found.rows.length === 0) {
      throw new TaskEngineError('UNKNOWN_DEPLOYMENT', `no lettered deployment with id ${id}`);
    }
    const marketId = Number(found.rows[0].market_id);
    const spec = determineNextTask('LETTERED', toState, { deploymentId: id, now });
    if (!spec) return null;
    return persistNextTask(client, { marketId, spec, source: 'TASK_ENGINE', actorId });
  });
}
