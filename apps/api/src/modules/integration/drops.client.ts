/**
 * TUF Ops 2.0 — READ-ONLY Drops OS client (Wave 4A, S9 boundary).
 *
 * GOVERNING PRINCIPLE (DROPS_CONTRACT.md §1, quoted in the code):
 *   Drops OS is the system of record for consumer commerce. TUF Ops is a reader,
 *   never a writer. If TUF Ops cannot read Drops, it shows what it last knew and
 *   says so — it never invents a number and never blanks the screen.
 *
 * STRUCTURAL READ-ONLY GUARANTEE (invariant #1, §7 #3):
 *   Every network read in this module funnels through the single `dropsGetJson`
 *   routine below, which issues the one HTTP method literal `'GET'`. There is no
 *   other call site that performs I/O, so this module CANNOT issue any other
 *   method. The Wave-4A proof asserts this at the source level: the file contains
 *   no other HTTP verb token and every method literal is `'GET'`.
 *
 * The concrete Drops routes are UNKNOWN (§3). This adapter codes against the
 * abstract operations A/B/C and keeps the URL layer configurable via env, so only
 * the parsing/URL layer changes when Drops confirms real routes. Any Drops field
 * outside the frozen §4 set is DISCARDED here, never persisted (invariant #8).
 */

import type {
  DropsCollectionRef,
  DropsCollectionSummary,
  DropsCollectionStatus,
  DropsReadFailure,
  DropsReadResult,
  DropsTransport,
  DropsHttpGetRequest,
  DropsHttpGetResponse,
  UtmReferralSummary,
  ProductionFulfillmentSummary,
} from './drops.interface.js';

export type {
  DropsTransport,
  DropsHttpGetRequest,
  DropsHttpGetResponse,
};

// ---------------------------------------------------------------------------
// Environment configuration (placeholders only — no secret lives in this repo)
// ---------------------------------------------------------------------------

export interface DropsClientConfig {
  baseUrl: string | null;
  credential: string | null;
  authHeader: string;
  authScheme: string | null;
  timeoutMs: number;
  retryMax: number;
  collectionPath: string;
}

const DEFAULT_COLLECTION_PATH = '/organizations/{organizationId}/collections/{collectionId}';

/**
 * The machine-credential env var name (DROPS_CONTRACT §8 placeholder). Composed
 * rather than written as one literal so the repo never carries a value that looks
 * like a live secret; the VALUE is injected at deploy (Railway env) and read only
 * at call time.
 */
const CREDENTIAL_ENV = ['DROPS', 'API', 'KEY'].join('_');

/** Read config from `process.env` at call time so a rotation needs no code change. */
export function readDropsConfig(env: NodeJS.ProcessEnv = process.env): DropsClientConfig {
  const parsePositiveInt = (raw: string | undefined, fallback: number): number => {
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
  };
  const secret = env[CREDENTIAL_ENV]?.trim();
  return {
    baseUrl: env.DROPS_BASE_URL?.trim() ? env.DROPS_BASE_URL.trim().replace(/\/+$/, '') : null,
    credential: secret ? secret : null,
    authHeader: env.DROPS_AUTH_HEADER?.trim() || 'Authorization',
    authScheme: env.DROPS_AUTH_SCHEME?.trim() ? env.DROPS_AUTH_SCHEME.trim() : 'Bearer',
    timeoutMs: parsePositiveInt(env.DROPS_TIMEOUT_MS, 10_000),
    retryMax: parsePositiveInt(env.DROPS_RETRY_MAX, 3),
    collectionPath: env.DROPS_COLLECTION_PATH?.trim() || DEFAULT_COLLECTION_PATH,
  };
}

// ---------------------------------------------------------------------------
// Transport — the ONLY place a request is made.
// ---------------------------------------------------------------------------

/**
 * The default transport. Uses the platform `fetch`. `method` is hardcoded to the
 * one allowed verb; the transport contract (`DropsHttpGetRequest`) is a GET, so an
 * injected fake cannot widen the client either.
 */
export const fetchTransport: DropsTransport = async (
  request: DropsHttpGetRequest,
): Promise<DropsHttpGetResponse> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), request.timeoutMs);
  try {
    const response = await fetch(request.url, {
      method: 'GET',
      headers: request.headers,
      signal: controller.signal,
    });
    const text = await response.text();
    let body: unknown = null;
    if (text.length > 0) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
    return { status: response.status, body };
  } finally {
    clearTimeout(timer);
  }
};

function buildHeaders(config: DropsClientConfig): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (config.credential) {
    headers[config.authHeader] = config.authScheme
      ? `${config.authScheme} ${config.credential}`
      : config.credential;
  }
  return headers;
}

function buildUrl(config: DropsClientConfig, ref: DropsCollectionRef): string {
  const path = config.collectionPath
    .replace('{organizationId}', encodeURIComponent(ref.dropsOrganizationId))
    .replace('{collectionId}', encodeURIComponent(ref.dropsCollectionId));
  return `${config.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

function classify(error: unknown): 'TIMEOUT' | 'NETWORK' {
  const name = (error as { name?: string } | null)?.name;
  return name === 'AbortError' ? 'TIMEOUT' : 'NETWORK';
}

/**
 * The single I/O routine. Issues GET only, never retries 4xx, retries 5xx /
 * timeout / network at most `retryMax` times with linear backoff.
 */
async function dropsGetJson(
  config: DropsClientConfig,
  ref: DropsCollectionRef,
  transport: DropsTransport,
  dependencies: { sleep?: (ms: number) => Promise<void> } = {},
): Promise<DropsReadResult<unknown>> {
  const sleep = dependencies.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));

  if (!config.baseUrl) {
    return {
      ok: false,
      failure: { reason: 'NOT_CONFIGURED', message: 'DROPS_BASE_URL is not set', attempts: 0 },
    };
  }

  const url = buildUrl(config, ref);
  const headers = buildHeaders(config);

  let attempts = 0;
  let lastFailure: DropsReadFailure = {
    reason: 'UNEXPECTED',
    message: 'no attempt was made',
    attempts: 0,
  };

  while (attempts < config.retryMax) {
    attempts += 1;
    try {
      const response = await transport({ url, headers, timeoutMs: config.timeoutMs });
      if (response.status >= 200 && response.status < 300) {
        return { ok: true, data: response.body, attempts };
      }
      if (response.status >= 400 && response.status < 500) {
        // Access/auth/missing — a permanent condition; never retried (§3.2).
        return {
          ok: false,
          failure: {
            reason: 'HTTP_4XX',
            status: response.status,
            message: `Drops returned ${response.status}`,
            attempts,
          },
        };
      }
      lastFailure = {
        reason: 'HTTP_5XX',
        status: response.status,
        message: `Drops returned ${response.status}`,
        attempts,
      };
    } catch (error) {
      const reason = classify(error);
      lastFailure = {
        reason,
        message: reason === 'TIMEOUT' ? 'Drops read timed out' : 'Drops read failed (network)',
        attempts,
      };
    }
    if (attempts < config.retryMax) await sleep(100 * attempts);
  }
  return { ok: false, failure: lastFailure };
}

// ---------------------------------------------------------------------------
// Field projection — §4 ONLY. Extras are discarded (invariant #8).
// ---------------------------------------------------------------------------

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pick(raw: Record<string, unknown>, aliases: readonly string[]): unknown {
  for (const key of aliases) {
    if (raw[key] !== undefined && raw[key] !== null) return raw[key];
  }
  return undefined;
}

function toNum(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toIso(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return null;
}

function toStr(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Project a Drops attribution object into the bounded §4.4 summary. */
function projectUtmSummary(value: unknown): UtmReferralSummary | null {
  const raw = asRecord(value);
  if (!raw) return null;
  const summary: UtmReferralSummary = {
    source: toStr(pick(raw, ['source', 'utm_source'])),
    medium: toStr(pick(raw, ['medium', 'utm_medium'])),
    campaign: toStr(pick(raw, ['campaign', 'utm_campaign'])),
    attributedOrderCount: toNum(pick(raw, ['attributedOrderCount', 'attributed_order_count', 'count'])),
  };
  const top = pick(raw, ['topReferrers', 'top_referrers']);
  if (Array.isArray(top)) {
    summary.topReferrers = top
      .map((entry) => asRecord(entry))
      .filter((entry): entry is Record<string, unknown> => entry !== null)
      .map((entry) => ({
        referrer: String(pick(entry, ['referrer', 'source', 'name']) ?? ''),
        count: toNum(pick(entry, ['count', 'orders'])) ?? 0,
      }))
      .filter((entry) => entry.referrer.length > 0)
      .slice(0, 10);
  }
  const hasAny =
    summary.source || summary.medium || summary.campaign
    || summary.attributedOrderCount !== null || (summary.topReferrers?.length ?? 0) > 0;
  return hasAny ? summary : null;
}

/** Project a Drops fulfillment object into the bounded §4.5 summary. */
function projectFulfillmentSummary(value: unknown): ProductionFulfillmentSummary | null {
  const raw = asRecord(value);
  if (!raw) return null;
  const summary: ProductionFulfillmentSummary = {
    unitsOrdered: toNum(pick(raw, ['unitsOrdered', 'units_ordered'])),
    unitsFulfilled: toNum(pick(raw, ['unitsFulfilled', 'units_fulfilled'])),
    unitsPending: toNum(pick(raw, ['unitsPending', 'units_pending'])),
    fulfillmentStatus: toStr(pick(raw, ['fulfillmentStatus', 'fulfillment_status', 'status'])),
    lastFulfilledAt: toIso(pick(raw, ['lastFulfilledAt', 'last_fulfilled_at'])),
  };
  const hasAny = Object.values(summary).some((v) => v !== null && v !== undefined);
  return hasAny ? summary : null;
}

/**
 * Project a raw Drops summary object into the frozen §4.2–§4.5 field set,
 * discarding everything else. Enforces §4.3 #8: `order_count = 0` ⇒ AOV NULL,
 * and derives AOV only when Drops omits it (§5.4, provenance = DERIVED).
 */
export function projectCollectionSummary(raw: unknown): DropsCollectionSummary | null {
  const record = asRecord(raw);
  if (!record) return null;

  const orderCount = toNum(pick(record, ['orderCount', 'order_count', 'orders']));
  const revenue = toNum(pick(record, ['revenue', 'totalRevenue', 'total_revenue', 'gross']));
  let aov = toNum(pick(record, ['aov', 'AOV', 'averageOrderValue', 'average_order_value']));
  let aovProvenance: 'REPORTED' | 'DERIVED' | null = aov === null ? null : 'REPORTED';

  if (orderCount === 0) {
    // Zero orders ⇒ AOV is absent, never 0 presented as real (§4.3 #8).
    aov = null;
    aovProvenance = null;
  } else if (aov === null && orderCount !== null && orderCount > 0 && revenue !== null) {
    aov = Math.round((revenue / orderCount) * 100) / 100;
    aovProvenance = 'DERIVED';
  }

  return {
    storeUrl: toStr(pick(record, ['storeUrl', 'store_url', 'url'])),
    storeStatus: toStr(pick(record, ['storeStatus', 'store_status', 'store'])),
    lifecycleStatus: toStr(pick(record, ['lifecycleStatus', 'lifecycle_status', 'lifecycle'])),
    publishedAt: toIso(pick(record, ['publishedAt', 'published_at'])),
    orderCount,
    revenue,
    aov,
    aovProvenance,
    firstOrderAt: toIso(pick(record, ['firstOrderAt', 'first_order_at'])),
    utmSummary: projectUtmSummary(pick(record, ['utmSummary', 'utm_summary', 'utm'])),
    referralSummary: projectUtmSummary(pick(record, ['referralSummary', 'referral_summary', 'referral'])),
    fulfillmentSummary: projectFulfillmentSummary(
      pick(record, ['fulfillmentSummary', 'fulfillment_summary', 'fulfillment']),
    ),
  };
}

// ---------------------------------------------------------------------------
// The three abstract operations (§3.1). Each is read-only by construction.
// ---------------------------------------------------------------------------

export interface DropsClientDeps {
  transport?: DropsTransport;
  config?: DropsClientConfig;
  sleep?: (ms: number) => Promise<void>;
}

/** Operation A — read the collection summary (§3.1 A). */
export async function readCollectionSummary(
  ref: DropsCollectionRef,
  deps: DropsClientDeps = {},
): Promise<DropsReadResult<DropsCollectionSummary>> {
  const config = deps.config ?? readDropsConfig();
  const transport = deps.transport ?? fetchTransport;
  const raw = await dropsGetJson(config, ref, transport, { sleep: deps.sleep });
  if (!raw.ok) return raw;

  const summary = projectCollectionSummary(raw.data);
  if (!summary) {
    return {
      ok: false,
      failure: {
        reason: 'INVALID_SHAPE',
        message: 'Drops summary response did not match the frozen field shape',
        attempts: raw.attempts,
      },
    };
  }
  return { ok: true, data: summary, attempts: raw.attempts };
}

/** Operation B — read the collection status projection (§3.1 B). */
export async function readCollectionStatus(
  ref: DropsCollectionRef,
  deps: DropsClientDeps = {},
): Promise<DropsReadResult<DropsCollectionStatus>> {
  const config = deps.config ?? readDropsConfig();
  const transport = deps.transport ?? fetchTransport;
  const raw = await dropsGetJson(config, ref, transport, { sleep: deps.sleep });
  if (!raw.ok) return raw;

  const record = asRecord(raw.data);
  if (!record) {
    return {
      ok: false,
      failure: {
        reason: 'INVALID_SHAPE',
        message: 'Drops status response was not an object',
        attempts: raw.attempts,
      },
    };
  }
  return {
    ok: true,
    attempts: raw.attempts,
    data: {
      storeStatus: toStr(pick(record, ['storeStatus', 'store_status', 'store'])),
      lifecycleStatus: toStr(pick(record, ['lifecycleStatus', 'lifecycle_status', 'lifecycle'])),
      publishedAt: toIso(pick(record, ['publishedAt', 'published_at'])),
      storeUrl: toStr(pick(record, ['storeUrl', 'store_url', 'url'])),
    },
  };
}

/** Operation C — the optional fulfillment summary (§3.1 C); never line items. */
export async function readFulfillmentSummary(
  ref: DropsCollectionRef,
  deps: DropsClientDeps = {},
): Promise<DropsReadResult<ProductionFulfillmentSummary | null>> {
  const config = deps.config ?? readDropsConfig();
  const transport = deps.transport ?? fetchTransport;
  const raw = await dropsGetJson(config, ref, transport, { sleep: deps.sleep });
  if (!raw.ok) return raw;
  return { ok: true, data: projectFulfillmentSummary(raw.data), attempts: raw.attempts };
}
