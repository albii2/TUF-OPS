/**
 * TUF Ops 2.0 — LETTERED deployment read client (frontend), Wave 3B.
 *
 * Consumes the backend endpoint being built THIS wave:
 *
 *   GET /api/v1/markets/:idOrNumber/lettered
 *
 * The endpoint may not exist yet when this module is first consumed. It is
 * therefore NORMALISED DEFENSIVELY and NEVER throws to the caller: a missing,
 * failing, or empty endpoint resolves to an honest "not yet available" result
 * — never a crash and never a fabricated deployment. This mirrors the Wave 2B
 * approach for the markets list.
 *
 * LETTERED's lifecycle state is TUF-owned (`@tuf/shared` state machine). We
 * store/read the canonical state string; we never let a Drops status drive it
 * (DROPS_CONTRACT §7 #8).
 */

import { apiClient } from './apiClient';

/**
 * A LETTERED deployment as consumed by the Market detail panel. A normalised
 * projection of the canonical `LetteredDeployment` (plan §2.1, §2.3; R8) plus
 * the denormalised display fields the panel needs.
 */
export type LetteredDeploymentRecord = {
  id: number | null;
  marketId: number | null;
  marketNumber: number | null;
  /** Canonical LETTERED lifecycle state (see `@tuf/shared`). Never Drops-derived. */
  state: string;
  objective: string;
  ownerId: number | null;
  priority: string | null;
  nextAction: string;
  /** ISO-8601, or '' when absent. NEVER a substituted date. */
  nextActionDue: string;
  blocker: string | null;
  dropsOrganizationId: string | null;
  dropsCollectionId: string | null;
  storefrontUrl: string | null;
  dropsDropId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

/**
 * The outcome of a LETTERED lookup. `ok:false` is the honest
 * "endpoint not yet available" state — the caller must render that, not a
 * placeholder deployment. `ok:true` with `deployment:null` means the endpoint
 * answered but no deployment is linked to the market yet.
 */
export type LetteredLookup =
  | { ok: true; deployment: LetteredDeploymentRecord | null }
  | { ok: false; error: string };

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

function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number.parseInt(value.trim(), 10);
    return parsed > 0 ? parsed : null;
  }
  return null;
}

/**
 * Normalise one wire object into a `LetteredDeploymentRecord`.
 *
 * Returns `null` for anything that is not a deployment. A deployment must carry
 * a canonical lifecycle `state` — without it there is nothing honest to render,
 * so we do not invent one.
 */
export function normalizeLetteredDeployment(raw: unknown): LetteredDeploymentRecord | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const row = raw as Record<string, unknown>;

  const state = firstString(row, ['state', 'lifecycleState', 'lifecycle_state']);
  if (state === null) return null;

  return {
    id: toPositiveInt(row.id ?? row.deployment_id ?? row.lettered_deployment_id),
    marketId: toPositiveInt(row.marketId ?? row.market_id),
    marketNumber: toPositiveInt(row.marketNumber ?? row.market_number),
    state,
    objective: firstString(row, ['objective']) ?? '',
    ownerId: toPositiveInt(row.ownerId ?? row.owner_id),
    priority: firstString(row, ['priority']),
    nextAction: firstString(row, ['nextAction', 'next_action']) ?? '',
    nextActionDue: firstString(row, ['nextActionDue', 'next_action_due']) ?? '',
    blocker: firstString(row, ['blocker']),
    dropsOrganizationId: firstString(row, ['dropsOrganizationId', 'drops_organization_id']),
    dropsCollectionId: firstString(row, ['dropsCollectionId', 'drops_collection_id', 'drop_id']),
    storefrontUrl: firstString(row, ['storefrontUrl', 'storefront_url', 'store_url']),
    dropsDropId: firstString(row, ['dropsDropId', 'drops_drop_id']),
    createdAt: firstString(row, ['createdAt', 'created_at']),
    updatedAt: firstString(row, ['updatedAt', 'updated_at']),
  };
}

const ENVELOPE_KEYS = ['deployment', 'letteredDeployment', 'lettered_deployment', 'lettered', 'data'];

/**
 * Extract a deployment from either a bare object or an envelope
 * (`{ deployment: {...} }`). Returns `null` when the payload carries no
 * deployment — including an explicit `null`.
 */
export function deploymentFromPayload(payload: unknown): LetteredDeploymentRecord | null {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return normalizeLetteredDeployment(payload);
  }
  const object = payload as Record<string, unknown>;
  for (const key of ENVELOPE_KEYS) {
    if (key in object) {
      const nested = object[key];
      if (nested === null || nested === undefined) return null;
      const normalised = normalizeLetteredDeployment(nested);
      if (normalised) return normalised;
    }
  }
  return normalizeLetteredDeployment(payload);
}

/**
 * GET /api/v1/markets/:idOrNumber/lettered
 *
 * Never throws. A transport failure (endpoint not built yet, 404, 5xx, auth)
 * resolves to `{ ok:false }` so the panel can render the honest
 * "not yet available" state instead of crashing or fabricating.
 */
export async function getLetteredDeploymentForMarket(
  marketNumber: number | string,
): Promise<LetteredLookup> {
  try {
    const payload = await apiClient<unknown>(`/markets/${marketNumber}/lettered`);
    return { ok: true, deployment: deploymentFromPayload(payload) };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'LETTERED deployment unavailable',
    };
  }
}
