/**
 * TUF Ops 2.0 — Markets read API client (frontend).
 *
 * Reads the operational MARKETS surface. Every row here is an ACTIVATED
 * Market; universe schools are NEVER returned by this service.
 *
 * Governing principle:
 *   Knowing a school exists does not make it a Market. A Market represents an
 *   intentional allocation of TUF resources.
 *
 * The backend `markets` module (apps/api/src/modules/markets) owns the
 * endpoint. The read endpoint (`GET /api/v1/markets`) is built in parallel by
 * the backend agent this wave, so the wire shape below is the DOCUMENTED
 * CONTRACT, normalised defensively so the frontend does not break on
 * snake_case vs camelCase, array vs envelope, until it is verified live.
 *
 * The single non-negotiable runtime guard is `normalizeMarketRow`: a row is
 * only a Market if it carries a positive integer `marketNumber` (allocated
 * from `market_number_seq` at activation and UNIQUE). A universe organization
 * row has no `marketNumber`, so it can never render on the MARKETS surface
 * even if a broken endpoint leaked one.
 */

import type { Market } from '@tuf/shared';
import { apiClient } from './apiClient';

export type RevenueEngineStatus = {
  teamUniforms: string | null;
  lettered: string | null;
  issue: string | null;
  note: string | null;
};

/**
 * A Market as consumed by the operational surface — the canonical `Market`
 * plus the denormalised display fields the War Board needs (school identity,
 * accountable owner's name, optional revenue-engine status).
 */
export interface MarketRecord extends Market {
  schoolName: string | null;
  schoolState: string | null;
  schoolCity: string | null;
  ownerName: string | null;
  revenueEngineStatus: RevenueEngineStatus | null;
}

function asString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number') return String(value);
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
 * Is this wire row an ACTIVATED Market? Only a positive integer
 * `marketNumber` qualifies. Universe organization rows fail this test.
 */
export function isActivatedMarketRow(raw: unknown): boolean {
  if (typeof raw !== 'object' || raw === null) return false;
  const row = raw as Record<string, unknown>;
  return toPositiveInt(row.marketNumber ?? row.market_number) !== null;
}

function normalizeRevenueEngine(raw: unknown): RevenueEngineStatus | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const value = raw as Record<string, unknown>;
  const status: RevenueEngineStatus = {
    teamUniforms: firstString(value, ['teamUniforms', 'team_uniforms']),
    lettered: firstString(value, ['lettered']),
    issue: firstString(value, ['issue']),
    note: firstString(value, ['note', 'message']),
  };
  if (!status.teamUniforms && !status.lettered && !status.issue && !status.note) return null;
  return status;
}

/**
 * Normalise one wire row into a `MarketRecord`. Returns `null` for anything
 * that is not an activated Market (the universe-record guard).
 */
export function normalizeMarketRow(raw: unknown): MarketRecord | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const row = raw as Record<string, unknown>;

  const marketNumber = toPositiveInt(row.marketNumber ?? row.market_number);
  if (marketNumber === null) return null;

  const nextActionDue =
    firstString(row, ['nextActionDue', 'next_action_due']) ?? '';

  return {
    id: toPositiveInt(row.id) ?? marketNumber,
    marketNumber,
    universeOrganizationId: toPositiveInt(row.universeOrganizationId ?? row.universe_organization_id) ?? 0,
    ownerId: toPositiveInt(row.ownerId ?? row.owner_id) ?? 0,
    priority: (firstString(row, ['priority']) ?? 'TIER_3') as Market['priority'],
    objective: firstString(row, ['objective']) ?? '',
    nextAction: firstString(row, ['nextAction', 'next_action']) ?? '',
    nextActionDue,
    state: (firstString(row, ['state']) ?? 'IDENTIFIED') as Market['state'],
    activatedAt: firstString(row, ['activatedAt', 'activated_at']) ?? '',
    blocker: firstString(row, ['blocker']),
    lastActivityAt: firstString(row, ['lastActivityAt', 'last_activity_at']),
    source: firstString(row, ['source']),
    createdBy: toPositiveInt(row.createdBy ?? row.created_by),
    updatedBy: toPositiveInt(row.updatedBy ?? row.updated_by),
    createdAt: firstString(row, ['createdAt', 'created_at']),
    updatedAt: firstString(row, ['updatedAt', 'updated_at']),
    name: firstString(row, ['name']),
    schoolName: firstString(row, ['schoolName', 'school_name', 'organizationName', 'organization_name', 'name']),
    schoolState: firstString(row, ['schoolState', 'school_state', 'state_market', 'org_state']),
    schoolCity: firstString(row, ['schoolCity', 'school_city', 'city']),
    ownerName: firstString(row, ['ownerName', 'owner_name', 'assignedRep', 'assigned_rep']),
    revenueEngineStatus: normalizeRevenueEngine(row.revenueEngineStatus ?? row.revenue_engine_status),
  };
}

function rowsFromPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (typeof payload === 'object' && payload !== null) {
    const value = payload as Record<string, unknown>;
    for (const key of ['markets', 'data', 'rows', 'items']) {
      if (Array.isArray(value[key])) return value[key] as unknown[];
    }
  }
  return [];
}

/** GET /api/v1/markets — the activated Markets, normalised, universe rows dropped. */
export async function listMarkets(): Promise<MarketRecord[]> {
  const payload = await apiClient<unknown>('/markets');
  return rowsFromPayload(payload)
    .map(normalizeMarketRow)
    .filter((row): row is MarketRecord => row !== null);
}

/** GET /api/v1/markets/:marketNumber — one activated Market, or undefined. */
export async function getMarketByNumber(marketNumber: number | string): Promise<MarketRecord | undefined> {
  const payload = await apiClient<unknown>(`/markets/${marketNumber}`);
  const normalised = normalizeMarketRow(payload);
  if (normalised) return normalised;
  // Fall back to scanning the list if the detail endpoint returns an envelope.
  const rows = rowsFromPayload(payload).map(normalizeMarketRow).filter((r): r is MarketRecord => r !== null);
  return rows[0];
}
