/**
 * TUF Ops 2.0 — Markets READ service (Wave 2A).
 *
 * Governing principle (ADR-001, ACTIVATE_MARKET_SPEC):
 *   Knowing a school exists does not make it a Market. A Market represents an
 *   intentional allocation of TUF resources.
 *
 * HARD INVARIANT — no universe leakage:
 *   The OPERATIONAL source is `markets` ALONE. `organizations` is the read-only
 *   *Market Universe* (intelligence) and is NEVER the source of an operational
 *   list. Every query here drives from `FROM markets`; the only reference to
 *   `organizations` is the display-name join on the market's OWN
 *   `universe_organization_id` (ADR-001 §5 explicitly budgets this single
 *   indexed FK hop so a Market can show its school's name). A universe row that
 *   was never activated therefore cannot appear in ANY response from this
 *   module — there is no code path that selects from `organizations` first.
 *
 * At initial state the operational list returns EXACTLY the three activated
 * markets: 001 Pillager, 002 Pequot Lakes, 003 Brainerd.
 */

import type { DbClientLike, DbPoolLike } from './markets.interface.js';

/** A Market as the operational API returns it. */
export interface OperationalMarket {
  id: number;
  /** System-assigned, monotonic; zero-padded to `001` for display. */
  marketNumber: number;
  /** Zero-padded display form of `marketNumber` (e.g. `001`). */
  marketNumberDisplay: string;
  state: string;
  priority: string;
  objective: string;
  nextAction: string;
  nextActionDue: string;
  blocker: string | null;
  ownerId: number;
  ownerName: string | null;
  /** The universe row this Market was activated from (provenance). */
  universeOrganizationId: number;
  /** Display name of the activated school (from the universe, display-only). */
  schoolName: string | null;
  activatedAt: string;
}

/** Columns selected for every operational read (single definition, no drift). */
const OPERATIONAL_SELECT = `
  SELECT
    m.id,
    m.market_number,
    m.state,
    m.priority,
    m.objective,
    m.next_action,
    m.next_action_due,
    m.blocker,
    m.owner_id,
    u.name AS owner_name,
    m.universe_organization_id,
    o.name AS school_name,
    m.activated_at
  FROM markets m
  LEFT JOIN users u ON u.id = m.owner_id
  LEFT JOIN organizations o ON o.id = m.universe_organization_id
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

function rowToOperationalMarket(row: Record<string, any>): OperationalMarket {
  const marketNumber = Number(row.market_number);
  return {
    id: Number(row.id),
    marketNumber,
    marketNumberDisplay: padMarketNumber(marketNumber),
    state: String(row.state),
    priority: String(row.priority),
    objective: String(row.objective),
    nextAction: String(row.next_action),
    nextActionDue: toIso(row.next_action_due),
    blocker: row.blocker ?? null,
    ownerId: Number(row.owner_id),
    ownerName: row.owner_name ?? null,
    universeOrganizationId: Number(row.universe_organization_id),
    schoolName: row.school_name ?? null,
    activatedAt: toIso(row.activated_at),
  };
}

/** Resolve the shared pool lazily so the module has no hard `pg` import. */
async function resolveDb(deps: { db?: DbPoolLike }): Promise<DbPoolLike> {
  if (deps.db) return deps.db;
  const mod = await import('@packages/database');
  return mod.pool as unknown as DbPoolLike;
}

async function withClient<R>(db: DbPoolLike, fn: (client: DbClientLike) => Promise<R>): Promise<R> {
  // Prefer a single connection when the pool exposes `connect`; fall back to a
  // pool-level query for minimal test doubles.
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
 * The OPERATIONAL markets list. Drives from `markets`; returns exactly the
 * activated markets (3 at initial state). No universe row can appear.
 */
export async function listOperationalMarkets(
  deps: { db?: DbPoolLike } = {},
): Promise<OperationalMarket[]> {
  const db = await resolveDb(deps);
  return withClient(db, async (client) => {
    const result = await client.query<Record<string, any>>(
      `${OPERATIONAL_SELECT} ORDER BY m.market_number`,
    );
    return result.rows.map(rowToOperationalMarket);
  });
}

/**
 * A single Market by `market_number` OR `id`. Returns null when no Market
 * matches — a universe-only school id therefore returns null (no operational
 * record exists for a school that was never activated).
 */
export async function getMarketByIdOrNumber(
  idOrNumber: number,
  deps: { db?: DbPoolLike } = {},
): Promise<OperationalMarket | null> {
  const db = await resolveDb(deps);
  return withClient(db, async (client) => {
    const result = await client.query<Record<string, any>>(
      `${OPERATIONAL_SELECT} WHERE m.market_number = $1 OR m.id = $1 LIMIT 1`,
      [idOrNumber],
    );
    return result.rows.length > 0 ? rowToOperationalMarket(result.rows[0]) : null;
  });
}

/**
 * Look a Market up by the universe organization it was activated from. This is
 * the explicit "is this school a Market?" question; a universe-only school
 * returns null. Used by the no-leakage proof.
 */
export async function findMarketByUniverseOrganization(
  universeOrganizationId: number,
  deps: { db?: DbPoolLike } = {},
): Promise<OperationalMarket | null> {
  const db = await resolveDb(deps);
  return withClient(db, async (client) => {
    const result = await client.query<Record<string, any>>(
      `${OPERATIONAL_SELECT} WHERE m.universe_organization_id = $1 LIMIT 1`,
      [universeOrganizationId],
    );
    return result.rows.length > 0 ? rowToOperationalMarket(result.rows[0]) : null;
  });
}

/** Count of operational markets (the gate's row count). */
export async function countOperationalMarkets(deps: { db?: DbPoolLike } = {}): Promise<number> {
  const db = await resolveDb(deps);
  return withClient(db, async (client) => {
    const result = await client.query<{ n: number }>('SELECT count(*)::int AS n FROM markets');
    return Number(result.rows[0]?.n ?? 0);
  });
}
