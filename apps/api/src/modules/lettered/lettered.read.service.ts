/**
 * TUF Ops 2.0 — LETTERED READ service (Wave 3A).
 *
 * HARD INVARIANT — a deployment is operational ONLY through its Market:
 *   The operational source is `lettered_deployments`, and every query drives
 *   from it JOINed to `markets` — NEVER from `organizations`. `organizations` is
 *   the read-only Market Universe and is never the source of an operational
 *   list. A universe row that was never activated therefore cannot expose a
 *   deployment. Drops OS is the system of record for the commerce behind a
 *   deployment; this module stores and returns only the R8 references.
 *
 * Per-market isolation is structural: every read is scoped by the market's
 * `market_number` OR `id`, so deployments for Pequot Lakes (002) and Brainerd
 * (003) can never be confused with Pillager's (001).
 */

import type { DbClientLike, DbPoolLike } from '../markets/markets.interface.js';

/** A LETTERED deployment as the operational API returns it. */
export interface OperationalLetteredDeployment {
  id: number;
  marketId: number;
  marketNumber: number;
  marketNumberDisplay: string;
  state: string;
  priority: string;
  objective: string;
  nextAction: string;
  nextActionDue: string;
  blocker: string | null;
  ownerId: number;
  ownerName: string | null;

  /** Drops OS references only (R8) — no products, orders, customers, payments. */
  dropsOrganizationId: string | null;
  dropsCollectionId: string | null;
  dropsDropId: string | null;
  storefrontUrl: string | null;

  source: string | null;
  lastActivityAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/** Columns selected for every operational read (single definition, no drift). */
const OPERATIONAL_SELECT = `
  SELECT
    ld.id,
    ld.market_id,
    m.market_number,
    ld.state,
    ld.priority,
    ld.objective,
    ld.next_action,
    ld.next_action_due,
    ld.blocker,
    ld.owner_id,
    u.name AS owner_name,
    ld.drops_organization_id,
    ld.drops_collection_id,
    ld.drops_drop_id,
    ld.storefront_url,
    ld.source,
    ld.last_activity_at,
    ld.created_at,
    ld.updated_at
  FROM lettered_deployments ld
  JOIN markets m ON m.id = ld.market_id
  LEFT JOIN users u ON u.id = ld.owner_id
`;

function padMarketNumber(value: number): string {
  return String(value).padStart(3, '0');
}

function toIso(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return String(value);
}

export function rowToOperationalLetteredDeployment(
  row: Record<string, any>,
): OperationalLetteredDeployment {
  const marketNumber = Number(row.market_number);
  return {
    id: Number(row.id),
    marketId: Number(row.market_id),
    marketNumber,
    marketNumberDisplay: padMarketNumber(marketNumber),
    state: String(row.state),
    priority: String(row.priority),
    objective: String(row.objective),
    nextAction: String(row.next_action),
    nextActionDue: toIso(row.next_action_due) as string,
    blocker: row.blocker ?? null,
    ownerId: Number(row.owner_id),
    ownerName: row.owner_name ?? null,
    dropsOrganizationId: row.drops_organization_id ?? null,
    dropsCollectionId: row.drops_collection_id ?? null,
    dropsDropId: row.drops_drop_id ?? null,
    storefrontUrl: row.storefront_url ?? null,
    source: row.source ?? null,
    lastActivityAt: toIso(row.last_activity_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
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
 * All LETTERED deployments for one Market, identified by `market_number` (`001`)
 * or `markets.id`. Drives from `lettered_deployments`; a market with no
 * deployments returns an empty list (never another market's rows).
 */
export async function listLetteredDeploymentsForMarket(
  marketIdOrNumber: number,
  deps: { db?: DbPoolLike } = {},
): Promise<OperationalLetteredDeployment[]> {
  const db = await resolveDb(deps);
  return withClient(db, async (client) => {
    const result = await client.query<Record<string, any>>(
      `${OPERATIONAL_SELECT} WHERE m.market_number = $1 OR m.id = $1 ORDER BY ld.id`,
      [marketIdOrNumber],
    );
    return result.rows.map(rowToOperationalLetteredDeployment);
  });
}

/**
 * Read one deployment by id USING an already-acquired client. Used by the write
 * service so a just-inserted/updated (possibly uncommitted) row is read back on
 * the SAME connection that wrote it.
 */
export async function getLetteredDeploymentByIdOnClient(
  client: DbClientLike,
  id: number,
): Promise<OperationalLetteredDeployment | null> {
  const result = await client.query<Record<string, any>>(
    `${OPERATIONAL_SELECT} WHERE ld.id = $1 LIMIT 1`,
    [id],
  );
  return result.rows.length > 0 ? rowToOperationalLetteredDeployment(result.rows[0]) : null;
}

/** A single LETTERED deployment by id. Returns null when no deployment matches. */
export async function getLetteredDeploymentById(
  id: number,
  deps: { db?: DbPoolLike } = {},
): Promise<OperationalLetteredDeployment | null> {
  const db = await resolveDb(deps);
  return withClient(db, async (client) => getLetteredDeploymentByIdOnClient(client, id));
}

/** Count of LETTERED deployments for a Market (the per-market isolation read). */
export async function countLetteredDeploymentsForMarket(
  marketIdOrNumber: number,
  deps: { db?: DbPoolLike } = {},
): Promise<number> {
  const db = await resolveDb(deps);
  return withClient(db, async (client) => {
    const result = await client.query<{ n: number }>(
      `SELECT count(*)::int AS n
         FROM lettered_deployments ld
         JOIN markets m ON m.id = ld.market_id
        WHERE m.market_number = $1 OR m.id = $1`,
      [marketIdOrNumber],
    );
    return Number(result.rows[0]?.n ?? 0);
  });
}
