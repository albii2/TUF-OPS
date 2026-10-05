/**
 * TUF Ops 2.0 — COMMAND read service (Wave 5A).
 *
 * "What needs to be done today?" — answered from REAL Markets/tasks/state, never
 * from fabricated dashboard metrics. The board is the set of OPEN tasks, each
 * carrying its Market's full obligation chain:
 *
 *   STATE -> OBJECTIVE -> OWNER -> NEXT ACTION -> DEADLINE -> BLOCKER
 *
 * Ordering is OVERDUE first, then due TODAY, then UPCOMING; within a bucket by
 * due date then id (deterministic).
 *
 * HONESTY: when there is nothing to do the board is genuinely empty
 * (`empty:true`, `count:0`, all buckets zero, `items:[]`). There is NO fallback
 * row, NO fabricated task and NO invented count (DROPS_CONTRACT §6 #3 spirit).
 */

import type { TaskBucket } from '@tuf/shared';
import type { DbClientLike, DbPoolLike } from './tasks.interface.js';

/** The entity kind a task's generating transition belongs to. */
export type CommandEntityKind = 'MARKET' | 'LETTERED';

/** One obligation on the COMMAND board, with its Market's chain. */
export interface CommandObligation {
  /** --- the task (the concrete next move) --- */
  taskId: number;
  taskKey: string | null;
  taskTitle: string;
  taskState: string;
  priority: string | null;
  source: string | null;
  entity: CommandEntityKind;
  dueAt: string;
  bucket: TaskBucket;

  /** --- the Market chain (STATE -> OBJECTIVE -> OWNER -> NEXT ACTION -> DEADLINE -> BLOCKER) --- */
  marketId: number;
  marketNumber: number;
  marketNumberDisplay: string;
  marketState: string;
  objective: string;
  ownerId: number;
  ownerName: string | null;
  nextAction: string;
  nextActionDue: string;
  blocker: string | null;
}

/** The COMMAND board. `empty:true` is an honest empty result, never a fake row. */
export interface CommandBoard {
  generatedAt: string;
  count: number;
  empty: boolean;
  buckets: { overdue: number; today: number; upcoming: number };
  items: CommandObligation[];
}

const COMMAND_SELECT = `
  SELECT
    t.id            AS task_id,
    t.task_key      AS task_key,
    t.title         AS task_title,
    t.state         AS task_state,
    t.priority      AS priority,
    t.source        AS source,
    t.due_at        AS due_at,
    m.id            AS market_id,
    m.market_number AS market_number,
    m.state         AS market_state,
    m.objective     AS objective,
    m.owner_id      AS owner_id,
    u.name          AS owner_name,
    m.next_action   AS next_action,
    m.next_action_due AS next_action_due,
    m.blocker       AS blocker,
    CASE
      WHEN t.due_at < now() THEN 'OVERDUE'
      WHEN t.due_at < date_trunc('day', now()) + interval '1 day' THEN 'TODAY'
      ELSE 'UPCOMING'
    END AS bucket
  FROM market_tasks t
  JOIN markets m ON m.id = t.market_id
  LEFT JOIN users u ON u.id = m.owner_id
  WHERE t.state = 'OPEN'
`;

const COMMAND_ORDER = `
  ORDER BY
    CASE
      WHEN t.due_at < now() THEN 0
      WHEN t.due_at < date_trunc('day', now()) + interval '1 day' THEN 1
      ELSE 2
    END,
    t.due_at ASC,
    t.id ASC
`;

function padMarketNumber(value: number): string {
  return String(value).padStart(3, '0');
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return String(value);
}

function entityFromKey(taskKey: string | null): CommandEntityKind {
  return taskKey && taskKey.startsWith('LETTERED:') ? 'LETTERED' : 'MARKET';
}

function rowToObligation(row: Record<string, any>): CommandObligation {
  const marketNumber = Number(row.market_number);
  return {
    taskId: Number(row.task_id),
    taskKey: row.task_key ?? null,
    taskTitle: String(row.task_title),
    taskState: String(row.task_state),
    priority: row.priority ?? null,
    source: row.source ?? null,
    entity: entityFromKey(row.task_key ?? null),
    dueAt: toIso(row.due_at),
    bucket: String(row.bucket) as TaskBucket,
    marketId: Number(row.market_id),
    marketNumber,
    marketNumberDisplay: padMarketNumber(marketNumber),
    marketState: String(row.market_state),
    objective: String(row.objective),
    ownerId: Number(row.owner_id),
    ownerName: row.owner_name ?? null,
    nextAction: String(row.next_action),
    nextActionDue: toIso(row.next_action_due),
    blocker: row.blocker ?? null,
  };
}

function toBoard(rows: Record<string, any>[], generatedAt: string): CommandBoard {
  const items = rows.map(rowToObligation);
  const buckets = { overdue: 0, today: 0, upcoming: 0 };
  for (const item of items) {
    if (item.bucket === 'OVERDUE') buckets.overdue += 1;
    else if (item.bucket === 'TODAY') buckets.today += 1;
    else buckets.upcoming += 1;
  }
  return {
    generatedAt,
    count: items.length,
    empty: items.length === 0,
    buckets,
    items,
  };
}

/** Resolve the shared pool lazily so the module has no hard `pg` import. */
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

/**
 * The whole COMMAND board: every OPEN task across every Market, ordered
 * overdue -> today -> upcoming. Returns an honest empty board when there is
 * nothing to do.
 */
export async function getCommandBoard(deps: { db?: DbPoolLike } = {}): Promise<CommandBoard> {
  const db = await resolveDb(deps);
  return withClient(db, async (client) => {
    const result = await client.query<Record<string, any>>(`${COMMAND_SELECT} ${COMMAND_ORDER}`);
    return toBoard(result.rows, new Date().toISOString());
  });
}

/**
 * COMMAND scoped to one Market (by `market_number` or `markets.id`). A Market
 * with no OPEN tasks yields an honest empty board — NOT a fabricated obligation.
 */
export async function getCommandForMarket(
  marketIdOrNumber: number,
  deps: { db?: DbPoolLike } = {},
): Promise<CommandBoard> {
  const db = await resolveDb(deps);
  return withClient(db, async (client) => {
    const result = await client.query<Record<string, any>>(
      `${COMMAND_SELECT} AND (m.market_number = $1 OR m.id = $1) ${COMMAND_ORDER}`,
      [marketIdOrNumber],
    );
    return toBoard(result.rows, new Date().toISOString());
  });
}
