/**
 * TUF Ops 2.0 — MarketMetric read client (frontend), Wave 4B.
 *
 * Consumes the backend endpoint being built THIS wave:
 *
 *   GET /api/v1/markets/:idOrNumber/metrics     (the MarketMetric cache snapshot)
 *
 * Drops OS is the system of record for consumer commerce. TUF Ops is a READER,
 * never a writer (DROPS_CONTRACT §1). This module reads the *cached* snapshot
 * and normalises it defensively, NEVER throwing to the caller: a missing,
 * failing, or empty endpoint resolves to an honest "not yet available" result —
 * never a crash and never a fabricated number.
 *
 * HARD RULES (asserted in tests):
 *   1. NO fabricated numbers. An absent metric is `null`, so the panel renders
 *      "no data" — it is NEVER coerced to a fake `0`. A genuinely reported `0`
 *      survives as `0` (it is the truth); "absent" and "zero" stay distinct.
 *   2. The snapshot is a snapshot: without a `fetched_at` timestamp there is
 *      nothing honest to date, so the payload is treated as "no snapshot yet".
 *   3. Staleness is reported ONLY when the backend marks it. We never invent a
 *      stale/fresh verdict of our own.
 *   4. A market is only a market with a positive integer marketNumber; without
 *      one we do not fetch (a universe organization row is not a market).
 *
 * The wire shape is the DOCUMENTED CONTRACT, normalised defensively so the
 * frontend accepts an envelope or a bare object, camelCase or snake_case, and
 * degrades honestly on anything unexpected (the Wave 2B / 3B pattern).
 */

import { apiClient } from './apiClient';

/**
 * A normalised MarketMetric snapshot projection for the Drops commerce panel.
 *
 * Only the approved summary fields are surfaced. Every commerce figure is
 * `number | null`: `null` means the backend did not report it (render "no
 * data"), which is distinct from a genuine `0`.
 */
export type MarketMetricRecord = {
  /** Storefront / collection status, as reported by Drops. */
  storeStatus: string | null;
  /** Lifecycle status, where Drops exposes it separately. */
  lifecycleStatus: string | null;
  /** Aggregate consumer order count. `null` when unknown. NEVER defaulted to 0. */
  orderCount: number | null;
  /** Aggregate consumer order value, as reported. `null` when unknown. */
  orderValue: number | null;
  /** Units ordered/fulfilled, as reported. `null` when unknown. */
  units: number | null;
  /** Human-readable attribution summary, or `null` when none is reported. */
  attributionSummary: string | null;
  /** Public storefront URL reference (stored string, never constructed here). */
  storeUrl: string | null;
  /** When the store/collection went public, if reported. */
  publishedAt: string | null;
  /** When the snapshot was fetched. A snapshot without one is not renderable. */
  fetchedAt: string;
  /** Backend staleness marker. True ONLY when the backend says so. */
  stale: boolean;
};

/**
 * The outcome of a MarketMetric lookup. `ok:false` is the honest
 * "endpoint not yet available" state. `ok:true` with `metric:null` means the
 * endpoint answered but no snapshot has been cached yet ("no data yet").
 */
export type MetricsLookup =
  | { ok: true; metric: MarketMetricRecord | null }
  | { ok: false; error: string };

/**
 * Is this a real market number? Only a positive integer qualifies. A universe
 * organization record carries no marketNumber and therefore never fetches.
 */
export function isMarketNumber(value: unknown): boolean {
  if (typeof value === 'number') return Number.isInteger(value) && value > 0;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return /^\d+$/.test(trimmed) && Number.parseInt(trimmed, 10) > 0;
  }
  return false;
}

function asString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function firstString(row: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value !== null) return value;
  }
  return null;
}

/**
 * Coerce to a non-negative finite number, or `null`. Crucially this returns
 * `null` for absent/blank/negative/NaN input — it never manufactures a 0. A
 * real reported `0` is preserved.
 */
function toNonNegativeNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }
  return null;
}

function firstNumber(row: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = toNonNegativeNumber(row[key]);
    if (value !== null) return value;
  }
  return null;
}

function toBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (lowered === 'true' || lowered === '1' || lowered === 'yes' || lowered === 'stale') return true;
    if (lowered === 'false' || lowered === '0' || lowered === 'no' || lowered === 'fresh') return false;
  }
  return null;
}

/**
 * Resolve the backend's staleness verdict. We only ever mark a snapshot stale
 * when the backend provides an explicit marker (a boolean flag, or a status
 * string that contains "stale"). Absent a signal, we do not invent staleness.
 */
function resolveStale(row: Record<string, unknown>): boolean {
  const direct = toBoolean(row.stale ?? row.isStale ?? row.is_stale ?? row.staleSnapshot ?? row.stale_snapshot);
  if (direct !== null) return direct;

  const status = firstString(row, ['staleStatus', 'stale_status', 'freshness', 'syncStatus', 'sync_status']);
  if (status !== null && status.toLowerCase().includes('stale')) return true;
  return false;
}

/**
 * Turn an attribution payload into a compact honest string, or `null` when it
 * carries nothing meaningful. Accepts a bare string, a source/medium/campaign
 * object, or a top-referrer list — always bounded, never per-order.
 */
export function formatAttributionSummary(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value !== 'object' || Array.isArray(value)) return null;

  const row = value as Record<string, unknown>;
  const parts: string[] = [];

  const source = firstString(row, ['source', 'utmSource', 'utm_source']);
  const medium = firstString(row, ['medium', 'utmMedium', 'utm_medium']);
  const campaign = firstString(row, ['campaign', 'utmCampaign', 'utm_campaign']);
  const referrer = firstString(row, ['referrer', 'topReferrer', 'top_referrer', 'primaryReferrer', 'primary_referrer']);
  if (source) parts.push(source);
  if (medium) parts.push(medium);
  if (campaign) parts.push(campaign);
  if (referrer) parts.push(`via ${referrer}`);

  const top = row.topReferrers ?? row.top_referrers;
  if (Array.isArray(top) && top.length > 0) {
    const labels = top
      .slice(0, 3)
      .map((entry): string | null => {
        if (typeof entry === 'string') return entry.trim() || null;
        if (entry && typeof entry === 'object') {
          const ref = entry as Record<string, unknown>;
          const name = firstString(ref, ['referrer', 'source', 'name']);
          const count = toNonNegativeNumber(ref.count ?? ref.orders);
          if (name && count !== null) return `${name} (${count})`;
          return name;
        }
        return null;
      })
      .filter((label): label is string => label !== null);
    if (labels.length > 0) parts.push(labels.join(', '));
  }

  const count = toNonNegativeNumber(
    row.attributedOrderCount ?? row.attributed_order_count ?? row.count ?? row.orders,
  );
  if (count !== null) parts.push(`${count} attributed`);

  return parts.length > 0 ? parts.join(' · ') : null;
}

/**
 * Normalise one wire object into a `MarketMetricRecord`.
 *
 * Returns `null` for anything that is not a renderable snapshot. A snapshot
 * requires a `fetched_at`-style timestamp — without one there is nothing honest
 * to date it with, so we do not invent a snapshot.
 */
export function normalizeMarketMetric(raw: unknown): MarketMetricRecord | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;

  const fetchedAt = firstString(row, [
    'fetchedAt',
    'fetched_at',
    'lastSyncAt',
    'last_sync_at',
    'syncedAt',
    'synced_at',
    'asOf',
    'as_of',
  ]);
  if (fetchedAt === null) return null;

  const productionRaw =
    row.productionSummary ?? row.production_summary ?? row.fulfillmentSummary ?? row.fulfillment_summary;
  const production =
    productionRaw && typeof productionRaw === 'object' && !Array.isArray(productionRaw)
      ? (productionRaw as Record<string, unknown>)
      : undefined;

  const units =
    firstNumber(row, ['units', 'unitCount', 'unit_count', 'totalUnits', 'total_units', 'unitsOrdered', 'units_ordered']) ??
    (production
      ? firstNumber(production, ['unitsOrdered', 'units_ordered', 'units', 'unitCount', 'unit_count'])
      : null);

  return {
    storeStatus: firstString(row, [
      'storeStatus',
      'store_status',
      'storefrontStatus',
      'storefront_status',
      'store',
      'collectionStatus',
      'collection_status',
    ]),
    lifecycleStatus: firstString(row, ['lifecycleStatus', 'lifecycle_status', 'status']),
    orderCount: firstNumber(row, ['orderCount', 'order_count', 'orders', 'totalOrders', 'total_orders']),
    orderValue: firstNumber(row, [
      'orderValue',
      'order_value',
      'revenue',
      'totalOrderValue',
      'total_order_value',
      'totalRevenue',
      'total_revenue',
    ]),
    units,
    attributionSummary: formatAttributionSummary(
      row.attributionSummary ??
        row.attribution_summary ??
        row.utmSummary ??
        row.utm_summary ??
        row.referralSummary ??
        row.referral_summary,
    ),
    storeUrl: firstString(row, ['storeUrl', 'store_url', 'storefrontUrl', 'storefront_url']),
    publishedAt: firstString(row, ['publishedAt', 'published_at']),
    fetchedAt,
    stale: resolveStale(row),
  };
}

const ENVELOPE_KEYS = ['metric', 'metrics', 'marketMetric', 'market_metric', 'snapshot', 'data'];

/**
 * Extract a snapshot from either a bare object or an envelope
 * (`{ metric: {...} }`). Returns `null` when the payload carries no snapshot —
 * including an explicit `null`.
 */
export function metricFromPayload(payload: unknown): MarketMetricRecord | null {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return normalizeMarketMetric(payload);
  }
  const object = payload as Record<string, unknown>;
  for (const key of ENVELOPE_KEYS) {
    if (key in object) {
      const nested = object[key];
      if (nested === null || nested === undefined) return null;
      const normalised = normalizeMarketMetric(nested);
      if (normalised) return normalised;
    }
  }
  return normalizeMarketMetric(payload);
}

/**
 * GET /api/v1/markets/:idOrNumber/metrics
 *
 * Never throws. A transport failure (endpoint not built yet, 404, 5xx, auth)
 * resolves to `{ ok:false }` so the panel can render the honest
 * "not yet available" state instead of crashing or fabricating a figure.
 */
export async function getMarketMetricsForMarket(
  marketNumber: number | string,
): Promise<MetricsLookup> {
  if (!isMarketNumber(marketNumber)) {
    // A universe organization record is not a market; do not even ask.
    return { ok: false, error: 'No market number' };
  }
  try {
    const payload = await apiClient<unknown>(`/markets/${marketNumber}/metrics`);
    return { ok: true, metric: metricFromPayload(payload) };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Market metrics unavailable',
    };
  }
}
