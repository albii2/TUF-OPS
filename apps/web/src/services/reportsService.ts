/**
 * TUF Ops 2.0 — Reports summary read client (frontend).
 *
 * S4 SEVERANCE: this module previously re-exported a fabricated `reportsSummary`
 * object from the 10,312-LOC fabricated sales-data fixture (invented members,
 * schools, orders and revenue) that shipped to production in the `/reports`
 * bundle. That fixture is GONE.
 *
 * Reports now read from the API. The backend has no `/reports/summary` route
 * yet, so the honest outcome today is `{ ok: false }` — the page renders a
 * "not yet available" state and shows NO numbers. There are NEVER fabricated
 * figures here: an absent figure is `null` (rendered as an em dash / hidden),
 * which is distinct from a genuine `0`.
 *
 * The wire shape is normalised defensively (envelope or bare object, camelCase
 * or snake_case) using the same Wave 2B / 3B / 4B / 5B approach as the markets,
 * LETTERED, MarketMetric and COMMAND clients.
 */

import type { RevenueLane } from '@tuf/shared';
import { apiClient } from './apiClient';

/** A figure the backend did not report is `null` — never coerced to a fake 0. */
export type ReportsSummary = {
  weeklySummary: {
    pipelineAdded: number | null;
    closedWon: number | null;
    newOrganizations: number | null;
    blockedOrders: number | null;
  };
  monthlySummary: {
    pipelineTotal: number | null;
    closedWon: number | null;
    winRate: number | null;
    averageDeal: number | null;
  };
  lanePerformance: Array<{
    lane: RevenueLane;
    pipeline: number | null;
    won: number | null;
    winRate: number | null;
  }>;
  repPerformance: Array<{
    rep: string;
    pipeline: number | null;
    won: number | null;
    openDeals: number | null;
  }>;
};

/**
 * The outcome of a reports lookup. `ok:false` is the honest
 * "endpoint not yet available" state — the caller renders that instead of a
 * placeholder summary. `ok:true` means the endpoint answered.
 */
export type ReportsLookup =
  | { ok: true; summary: ReportsSummary }
  | { ok: false; error: string };

const KNOWN_LANES: RevenueLane[] = ['UNIFORM', 'TEAM_STORE', 'TRAVEL_GEAR', 'LETTERMAN'];

function asObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/**
 * Coerce to a finite number, or `null` when absent/unparseable. This NEVER
 * manufactures a 0 — a real reported 0 survives as 0.
 */
function asNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function pickNumber(row: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = asNumber(row[key]);
    if (value !== null) return value;
  }
  return null;
}

function pickString(row: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value !== null) return value;
  }
  return null;
}

function normalizeLane(value: unknown): RevenueLane | null {
  const raw = asString(value);
  if (raw === null) return null;
  const upper = raw.toUpperCase();
  return (KNOWN_LANES as string[]).includes(upper) ? (upper as RevenueLane) : null;
}

function normalizeWeekly(raw: unknown): ReportsSummary['weeklySummary'] {
  const row = asObject(raw) ?? {};
  return {
    pipelineAdded: pickNumber(row, ['pipelineAdded', 'pipeline_added']),
    closedWon: pickNumber(row, ['closedWon', 'closed_won']),
    newOrganizations: pickNumber(row, ['newOrganizations', 'new_organizations']),
    blockedOrders: pickNumber(row, ['blockedOrders', 'blocked_orders']),
  };
}

function normalizeMonthly(raw: unknown): ReportsSummary['monthlySummary'] {
  const row = asObject(raw) ?? {};
  return {
    pipelineTotal: pickNumber(row, ['pipelineTotal', 'pipeline_total']),
    closedWon: pickNumber(row, ['closedWon', 'closed_won']),
    winRate: pickNumber(row, ['winRate', 'win_rate']),
    averageDeal: pickNumber(row, ['averageDeal', 'average_deal', 'avgDeal', 'avg_deal']),
  };
}

function normalizeLanePerformance(raw: unknown): ReportsSummary['lanePerformance'] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      const row = asObject(entry);
      const lane = row ? normalizeLane(row.lane) : null;
      if (!row || lane === null) return null;
      return {
        lane,
        pipeline: pickNumber(row, ['pipeline']),
        won: pickNumber(row, ['won']),
        winRate: pickNumber(row, ['winRate', 'win_rate']),
      };
    })
    .filter((row): row is ReportsSummary['lanePerformance'][number] => row !== null);
}

function normalizeRepPerformance(raw: unknown): ReportsSummary['repPerformance'] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      const row = asObject(entry);
      const rep = row ? pickString(row, ['rep', 'name']) : null;
      if (!row || rep === null) return null;
      return {
        rep,
        pipeline: pickNumber(row, ['pipeline', 'pipelineValue', 'pipeline_value']),
        won: pickNumber(row, ['won', 'closedWon', 'closed_won']),
        openDeals: pickNumber(row, ['openDeals', 'open_deals', 'activeOpportunities', 'active_opportunities']),
      };
    })
    .filter((row): row is ReportsSummary['repPerformance'][number] => row !== null);
}

/**
 * Normalise a reports payload. Returns `null` for anything that is not a
 * reports summary object — an absent or unrecognised payload must NOT become a
 * zero-filled summary.
 */
export function normalizeReportsSummary(raw: unknown): ReportsSummary | null {
  const envelope = asObject(raw);
  if (envelope === null) return null;
  const inner = asObject(envelope.summary ?? envelope.reports ?? envelope.report ?? envelope.data);
  const source = inner ?? envelope;
  if (
    !('weeklySummary' in source) &&
    !('weekly_summary' in source) &&
    !('monthlySummary' in source) &&
    !('monthly_summary' in source) &&
    !('lanePerformance' in source) &&
    !('lane_performance' in source) &&
    !('repPerformance' in source) &&
    !('rep_performance' in source)
  ) {
    return null;
  }
  return {
    weeklySummary: normalizeWeekly(source.weeklySummary ?? source.weekly_summary),
    monthlySummary: normalizeMonthly(source.monthlySummary ?? source.monthly_summary),
    lanePerformance: normalizeLanePerformance(source.lanePerformance ?? source.lane_performance),
    repPerformance: normalizeRepPerformance(source.repPerformance ?? source.rep_performance),
  };
}

/**
 * GET /api/v1/reports/summary
 *
 * Never throws. A transport failure (endpoint not built yet, 404, 5xx, auth)
 * resolves to `{ ok:false }` so the page can render the honest
 * "not yet available" state instead of a fabricated summary.
 */
export async function getReportsSummary(): Promise<ReportsLookup> {
  try {
    const payload = await apiClient<unknown>('/reports/summary');
    const summary = normalizeReportsSummary(payload);
    if (summary === null) {
      return { ok: false, error: 'Reports service returned no summary' };
    }
    return { ok: true, summary };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Reports service unavailable',
    };
  }
}
