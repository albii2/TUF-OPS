/**
 * TUF Ops 2.0 — Drops metric cache + fetch service (Wave 4A, S9 boundary).
 *
 * GOVERNING PRINCIPLE (DROPS_CONTRACT.md §1 / §6):
 *   If TUF Ops cannot read Drops, it shows what it last knew and says so — it
 *   never invents a number and never blanks the screen.
 *
 * Behaviour, exactly as the contract fixes it:
 *   - `refreshMarketMetric` reads Drops and, on SUCCESS, overwrites the
 *     `market_metrics` snapshot and advances `last_sync_at` (§5.3).
 *   - On a Drops failure it leaves the snapshot UNCHANGED, does NOT advance
 *     `last_sync_at`, and returns a typed failure (§6). It never throws for a
 *     Drops failure — the request path must not fail because Drops is down.
 *   - `getMarketCommerceMetrics` serves the CACHED snapshot marked STALE; a
 *     never-synced key yields an explicit "no data yet" view that is NEVER `0`
 *     (§6 #3, GATE0 "zero rows ⇒ zero numbers").
 *
 * Cache identity is the Drops key `(drops_organization_id, drops_collection_id)`
 * (§5.2); `market_id` / `lettered_deployment_id` are TUF-side routing references.
 */

import type { UtmReferralSummary, ProductionFulfillmentSummary } from '@tuf/shared';
import type { DbClientLike, DbPoolLike } from '../markets/markets.interface.js';
import {
  readCollectionSummary,
  type DropsClientDeps,
} from './drops.client.js';
import type {
  CommerceMetricsView,
  DropsCollectionRef,
  DropsReadFailureReason,
  MarketMetricRefreshResult,
} from './drops.interface.js';

export interface MarketMetricDeps extends DropsClientDeps {
  db?: DbPoolLike;
  /** Injectable clock for deterministic staleness tests. */
  now?: () => Date;
}

/** The stale window in minutes (DROPS_STALE_AFTER, default 60 — §5.3). */
export function dropsStaleAfterMinutes(env: NodeJS.ProcessEnv = process.env): number {
  const value = Number(env.DROPS_STALE_AFTER);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 60;
}

/** The poll cadence in minutes (DROPS_POLL_INTERVAL, default 15 — §5.3). */
export function dropsPollIntervalMinutes(env: NodeJS.ProcessEnv = process.env): number {
  const value = Number(env.DROPS_POLL_INTERVAL);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 15;
}

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

function toIso(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return null;
}

function toNumOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** The resolved Drops linkage for a Market's deployment. */
export interface ResolvedDeploymentMetric {
  marketId: number;
  marketNumber: number;
  letteredDeploymentId: number;
  ref: DropsCollectionRef;
  storeUrl: string | null;
}

const RESOLVE_SELECT = `
  SELECT ld.id AS lettered_deployment_id,
         m.id AS market_id,
         m.market_number,
         ld.drops_organization_id,
         ld.drops_collection_id,
         ld.drops_drop_id,
         ld.storefront_url
    FROM lettered_deployments ld
    JOIN markets m ON m.id = ld.market_id
`;

function mapResolved(row: Record<string, any>): ResolvedDeploymentMetric {
  return {
    marketId: Number(row.market_id),
    marketNumber: Number(row.market_number),
    letteredDeploymentId: Number(row.lettered_deployment_id),
    ref: {
      dropsOrganizationId: String(row.drops_organization_id),
      dropsCollectionId: String(row.drops_collection_id),
      dropsDropId: row.drops_drop_id ?? null,
    },
    storeUrl: row.storefront_url ?? null,
  };
}

/**
 * Resolve the market's deployment that carries Drops references. Prefers a
 * deployment already in the LIVE commerce state, else the newest one. Returns
 * null when the market has no linked deployment (⇒ "no data yet", never a zero).
 */
export async function resolveDeploymentForMarket(
  marketIdOrNumber: number,
  deps: { db?: DbPoolLike } = {},
): Promise<ResolvedDeploymentMetric | null> {
  const db = await resolveDb(deps);
  return withClient(db, async (client) => {
    const result = await client.query<Record<string, any>>(
      `${RESOLVE_SELECT}
        WHERE (m.market_number = $1 OR m.id = $1)
          AND ld.drops_organization_id IS NOT NULL
          AND ld.drops_collection_id IS NOT NULL
        ORDER BY (ld.state = 'LIVE') DESC, ld.id DESC
        LIMIT 1`,
      [marketIdOrNumber],
    );
    return result.rows.length > 0 ? mapResolved(result.rows[0]) : null;
  });
}

/** Resolve linkage for a specific deployment id. */
export async function resolveDeploymentById(
  deploymentId: number,
  deps: { db?: DbPoolLike } = {},
): Promise<ResolvedDeploymentMetric | null> {
  const db = await resolveDb(deps);
  return withClient(db, async (client) => {
    const result = await client.query<Record<string, any>>(
      `${RESOLVE_SELECT}
        WHERE ld.id = $1
          AND ld.drops_organization_id IS NOT NULL
          AND ld.drops_collection_id IS NOT NULL
        LIMIT 1`,
      [deploymentId],
    );
    return result.rows.length > 0 ? mapResolved(result.rows[0]) : null;
  });
}

/**
 * Fetch the collection summary from Drops and, on success, upsert the cache.
 * Returns a typed result; a Drops failure is NEVER an exception.
 */
export async function refreshMarketMetric(
  resolved: ResolvedDeploymentMetric,
  deps: MarketMetricDeps = {},
): Promise<MarketMetricRefreshResult> {
  const read = await readCollectionSummary(resolved.ref, {
    transport: deps.transport,
    config: deps.config,
    sleep: deps.sleep,
  });

  if (!read.ok) {
    // §5.3 / §6: leave the snapshot untouched, do not advance last_sync_at.
    return {
      ok: false,
      reason: 'DROPS_READ_FAILED',
      failure: read.failure,
      stored: false,
      lastSyncAt: null,
    };
  }

  const s = read.data;
  const db = await resolveDb(deps);
  try {
    const lastSyncAt = await withClient(db, async (client) => {
      const result = await client.query<{ last_sync_at: Date }>(
        `INSERT INTO market_metrics (
           market_id, lettered_deployment_id,
           drops_organization_id, drops_collection_id, drops_drop_id,
           store_url, store_status, lifecycle_status, published_at,
           order_count, revenue, aov, aov_provenance, first_order_at,
           utm_summary, referral_summary, fulfillment_summary,
           last_sync_at, updated_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz,
           $10, $11::numeric, $12::numeric, $13, $14::timestamptz,
           $15::jsonb, $16::jsonb, $17::jsonb, now(), now()
         )
         ON CONFLICT (drops_organization_id, drops_collection_id)
         DO UPDATE SET
           market_id = EXCLUDED.market_id,
           lettered_deployment_id = EXCLUDED.lettered_deployment_id,
           drops_drop_id = EXCLUDED.drops_drop_id,
           store_url = EXCLUDED.store_url,
           store_status = EXCLUDED.store_status,
           lifecycle_status = EXCLUDED.lifecycle_status,
           published_at = EXCLUDED.published_at,
           order_count = EXCLUDED.order_count,
           revenue = EXCLUDED.revenue,
           aov = EXCLUDED.aov,
           aov_provenance = EXCLUDED.aov_provenance,
           first_order_at = EXCLUDED.first_order_at,
           utm_summary = EXCLUDED.utm_summary,
           referral_summary = EXCLUDED.referral_summary,
           fulfillment_summary = EXCLUDED.fulfillment_summary,
           last_sync_at = now(),
           updated_at = now()
         RETURNING last_sync_at`,
        [
          resolved.marketId,
          resolved.letteredDeploymentId,
          resolved.ref.dropsOrganizationId,
          resolved.ref.dropsCollectionId,
          resolved.ref.dropsDropId ?? null,
          s.storeUrl ?? resolved.storeUrl ?? null,
          s.storeStatus,
          s.lifecycleStatus,
          s.publishedAt,
          s.orderCount,
          s.revenue,
          s.aov,
          s.aovProvenance ?? 'REPORTED',
          s.firstOrderAt,
          s.utmSummary ? JSON.stringify(s.utmSummary) : null,
          s.referralSummary ? JSON.stringify(s.referralSummary) : null,
          s.fulfillmentSummary ? JSON.stringify(s.fulfillmentSummary) : null,
        ],
      );
      return toIso(result.rows[0]?.last_sync_at);
    });

    return { ok: true, reason: 'OK', stored: true, lastSyncAt };
  } catch {
    return { ok: false, reason: 'PERSIST_FAILED', stored: false, lastSyncAt: null };
  }
}

interface CachedRow {
  market_id: number | null;
  lettered_deployment_id: number | null;
  drops_organization_id: string;
  drops_collection_id: string;
  drops_drop_id: string | null;
  store_url: string | null;
  store_status: string | null;
  lifecycle_status: string | null;
  published_at: unknown;
  order_count: unknown;
  revenue: unknown;
  aov: unknown;
  aov_provenance: string | null;
  first_order_at: unknown;
  utm_summary: UtmReferralSummary | null;
  referral_summary: UtmReferralSummary | null;
  fulfillment_summary: ProductionFulfillmentSummary | null;
  last_sync_at: unknown;
}

async function readCachedMetric(
  ref: DropsCollectionRef,
  deps: { db?: DbPoolLike },
): Promise<CachedRow | null> {
  const db = await resolveDb(deps);
  return withClient(db, async (client) => {
    const result = await client.query<CachedRow>(
      `SELECT market_id, lettered_deployment_id,
              drops_organization_id, drops_collection_id, drops_drop_id,
              store_url, store_status, lifecycle_status, published_at,
              order_count, revenue, aov, aov_provenance, first_order_at,
              utm_summary, referral_summary, fulfillment_summary, last_sync_at
         FROM market_metrics
        WHERE drops_organization_id = $1 AND drops_collection_id = $2
        LIMIT 1`,
      [ref.dropsOrganizationId, ref.dropsCollectionId],
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  });
}

function emptyView(resolved: ResolvedDeploymentMetric | null): CommerceMetricsView {
  return {
    marketId: resolved?.marketId ?? null,
    marketNumber: resolved?.marketNumber ?? null,
    letteredDeploymentId: resolved?.letteredDeploymentId ?? null,
    dropsOrganizationId: resolved?.ref.dropsOrganizationId ?? null,
    dropsCollectionId: resolved?.ref.dropsCollectionId ?? null,
    storeUrl: resolved?.storeUrl ?? null,
    storeStatus: null,
    lifecycleStatus: null,
    publishedAt: null,
    orderCount: null,
    revenue: null,
    aov: null,
    aovProvenance: null,
    firstOrderAt: null,
    utmSummary: null,
    referralSummary: null,
    fulfillmentSummary: null,
    lastSyncAt: null,
    stale: true,
    staleReason: null,
    hasData: false,
    noDataYet: true,
    refreshError: null,
  };
}

function rowToView(row: CachedRow, resolved: ResolvedDeploymentMetric | null): CommerceMetricsView {
  return {
    marketId: row.market_id ?? resolved?.marketId ?? null,
    marketNumber: resolved?.marketNumber ?? null,
    letteredDeploymentId: row.lettered_deployment_id ?? resolved?.letteredDeploymentId ?? null,
    dropsOrganizationId: row.drops_organization_id,
    dropsCollectionId: row.drops_collection_id,
    storeUrl: row.store_url ?? resolved?.storeUrl ?? null,
    storeStatus: row.store_status ?? null,
    lifecycleStatus: row.lifecycle_status ?? null,
    publishedAt: toIso(row.published_at),
    orderCount: toNumOrNull(row.order_count),
    revenue: toNumOrNull(row.revenue),
    aov: toNumOrNull(row.aov),
    aovProvenance: (row.aov_provenance as 'REPORTED' | 'DERIVED' | null) ?? null,
    firstOrderAt: toIso(row.first_order_at),
    utmSummary: row.utm_summary ?? null,
    referralSummary: row.referral_summary ?? null,
    fulfillmentSummary: row.fulfillment_summary ?? null,
    lastSyncAt: toIso(row.last_sync_at),
    stale: false,
    staleReason: null,
    hasData: true,
    noDataYet: false,
    refreshError: null,
  };
}

/**
 * The reader. Cache-first by default (must not block the request path — §6 #5).
 * When `opts.refresh` is set it attempts a fresh Drops read first; on failure it
 * degrades to the cached snapshot marked STALE with a typed warning, and NEVER
 * throws (§6 #6) and NEVER fabricates (§6 #3).
 */
export async function getMarketCommerceMetrics(
  marketIdOrNumber: number,
  deps: MarketMetricDeps = {},
  opts: { refresh?: boolean } = {},
): Promise<CommerceMetricsView> {
  const resolved = await resolveDeploymentForMarket(marketIdOrNumber, deps);
  return buildView(resolved, deps, opts);
}

/** As above but scoped to a specific deployment id. */
export async function getDeploymentCommerceMetrics(
  deploymentId: number,
  deps: MarketMetricDeps = {},
  opts: { refresh?: boolean } = {},
): Promise<CommerceMetricsView> {
  const resolved = await resolveDeploymentById(deploymentId, deps);
  return buildView(resolved, deps, opts);
}

async function buildView(
  resolved: ResolvedDeploymentMetric | null,
  deps: MarketMetricDeps,
  opts: { refresh?: boolean },
): Promise<CommerceMetricsView> {
  const now = deps.now ?? (() => new Date());
  let refreshError: DropsReadFailureReason | null = null;

  if (resolved && opts.refresh) {
    const refresh = await refreshMarketMetric(resolved, deps);
    if (!refresh.ok && refresh.failure) refreshError = refresh.failure.reason;
    if (!refresh.ok && refresh.reason === 'NO_DEPLOYMENT') refreshError = refreshError ?? 'UNEXPECTED';
  }

  if (!resolved) {
    // No Drops linkage at all: explicitly "no data yet" — never zeros.
    const view = emptyView(null);
    view.refreshError = refreshError;
    return view;
  }

  const row = await readCachedMetric(resolved.ref, deps);
  if (!row) {
    const view = emptyView(resolved);
    view.refreshError = refreshError;
    view.stale = true;
    view.staleReason = refreshError ? 'DROPS_UNREACHABLE' : null;
    return view;
  }

  const view = rowToView(row, resolved);
  view.refreshError = refreshError;

  const windowMs = dropsStaleAfterMinutes() * 60_000;
  const lastSyncMs = view.lastSyncAt ? Date.parse(view.lastSyncAt) : Number.NaN;
  const windowExceeded = Number.isNaN(lastSyncMs) || now().getTime() - lastSyncMs > windowMs;

  if (refreshError) {
    // §6 #2: Drops was unreachable this cycle ⇒ mark the Drops-sourced block STALE.
    view.stale = true;
    view.staleReason = 'DROPS_UNREACHABLE';
  } else if (windowExceeded) {
    view.stale = true;
    view.staleReason = 'WINDOW_EXCEEDED';
  } else {
    view.stale = false;
    view.staleReason = null;
  }
  return view;
}

/**
 * Poll one market's collection once (used by the scheduled fetcher and by an
 * explicit operator refresh). Never throws on a Drops failure.
 */
export async function syncMarketMetric(
  marketIdOrNumber: number,
  deps: MarketMetricDeps = {},
): Promise<MarketMetricRefreshResult> {
  const resolved = await resolveDeploymentForMarket(marketIdOrNumber, deps);
  if (!resolved) {
    return { ok: false, reason: 'NO_DEPLOYMENT', stored: false, lastSyncAt: null };
  }
  return refreshMarketMetric(resolved, deps);
}
