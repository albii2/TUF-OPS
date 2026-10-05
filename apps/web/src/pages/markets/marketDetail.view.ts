/**
 * TUF Ops 2.0 — pure view logic for the Market detail page (Wave 3B).
 *
 * Kept free of React and of any network import so the display rules are
 * provable without a live API (the same pattern as `markets.view.ts` and
 * `command.view.ts`).
 *
 * Two hard rules, asserted in tests:
 *   1. NO fabricated numbers. Missing data renders an honest empty state —
 *      never a fake `0` and never an invented row.
 *   2. A record without a `marketNumber` is NEVER a Market. `buildMarketDetail`
 *      returns `null` for such a record so the page can refuse to render it.
 */

import { LETTERED_LIFECYCLE_STATES, LETTERED_STATES } from '@tuf/shared';
import type { MarketRecord } from '../../services/marketsService';
import type { LetteredDeploymentRecord, LetteredLookup } from '../../services/letteredService';
import type { MarketMetricRecord, MetricsLookup } from '../../services/metricsService';
import { dueLabel } from './markets.view';

/** Honest copy for every empty state on the page. No number, ever. */
export const MARKET_DETAIL_COPY = {
  noNextAction: 'No next action recorded',
  noDueDate: 'No due date recorded',
  noBlocker: 'No blocker',
  noObjective: 'No objective recorded',
  unassignedOwner: 'Unassigned',
  unknownLocation: 'Location unknown',
  unknownSchool: 'School name not recorded',
  unknownPriority: 'UNRANKED',
  revenueNotReported: 'Not reported',
  noRevenueEngine: 'No revenue engine data available yet',
  noRevenueEngineDetail:
    'Revenue signals arrive when the three engines report. Nothing is shown rather than a placeholder number.',
  universeNotRecorded: 'Universe reference not recorded',
  unknownLifecycleState: 'Unrecognised state',
  letteredLoading: 'Loading LETTERED deployment…',
  letteredUnavailable: 'LETTERED deployment data not yet available',
  letteredUnavailableDetail:
    'The LETTERED deployment endpoint is not answering yet. Nothing is shown rather than a placeholder deployment.',
  letteredNone: 'No LETTERED deployment activated for this market yet.',
  letteredNextActionNone: 'No next action recorded',
  dropsTitle: 'Drops OS commerce',
  dropsLoading: 'Loading Drops OS commerce…',
  dropsUnavailable: 'Drops commerce not yet available',
  dropsUnavailableDetail:
    'The market metrics endpoint is not answering yet. Nothing is shown rather than a placeholder commerce figure (R8 forbids a fabricated number).',
  dropsNone: 'No Drops commerce snapshot yet',
  dropsNoneDetail:
    'No snapshot has been cached for this market yet. No figure is shown rather than a zero that is not real.',
  dropsStale: 'STALE',
  dropsSnapshot: 'SNAPSHOT',
  dropsStaleNotice:
    'This snapshot is marked stale by the backend — the figures below are what TUF Ops last knew, not live commerce.',
  dropsNoData: 'no data',
  dropsNoSyncTime: 'sync time not recorded',
  dropsReadOnly: 'Read-only · Drops OS is the system of record',
} as const;

/** A single revenue-engine status row (honest empty state when unreported). */
export type RevenueEngineRow = {
  key: 'teamUniforms' | 'lettered' | 'issue';
  label: string;
  value: string;
  isReported: boolean;
};

export type MarketDetailView = {
  marketNumber: number;
  marketNumberDisplay: string;
  schoolName: string;
  location: string;
  stateLabel: string;
  priority: string;
  owner: string;
  objective: string;
  nextAction: string;
  hasNextAction: boolean;
  nextActionDueAbsolute: string;
  nextActionDueLabel: string;
  hasDueDate: boolean;
  blocker: string | null;
  hasBlocker: boolean;
  activatedAtAbsolute: string;
  universeOrganizationId: number | null;
  universeReference: string;
  revenue: RevenueEngineRow[];
  hasRevenueData: boolean;
};

/**
 * The activation gate, applied to a single record. A MarketRecord requires a
 * positive integer `marketNumber`; a universe organization row has none, so it
 * can never pass here.
 */
export function isMarketRecord(record: unknown): record is MarketRecord {
  if (typeof record !== 'object' || record === null) return false;
  const value = (record as { marketNumber?: unknown }).marketNumber;
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function formatAbsolute(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString();
}

function humanizeState(state: string): string {
  return state.split('_').join(' ');
}

/**
 * Build the entire display model for one Market. Returns `null` when the input
 * is not an activated Market — the caller then renders the honest
 * "not a market" state rather than a Market row.
 */
export function buildMarketDetail(market: MarketRecord, now: Date): MarketDetailView | null {
  if (!isMarketRecord(market)) return null;

  const engine = market.revenueEngineStatus;
  const revenue: RevenueEngineRow[] = [
    { key: 'teamUniforms', label: 'TEAM UNIFORMS', value: engine?.teamUniforms ?? MARKET_DETAIL_COPY.revenueNotReported, isReported: Boolean(engine?.teamUniforms) },
    { key: 'lettered', label: 'LETTERED', value: engine?.lettered ?? MARKET_DETAIL_COPY.revenueNotReported, isReported: Boolean(engine?.lettered) },
    { key: 'issue', label: 'ISSUE', value: engine?.issue ?? MARKET_DETAIL_COPY.revenueNotReported, isReported: Boolean(engine?.issue) },
  ];

  const schoolName = market.schoolName ?? MARKET_DETAIL_COPY.unknownSchool;
  const location =
    [market.schoolCity, market.schoolState].filter(Boolean).join(', ') || MARKET_DETAIL_COPY.unknownLocation;

  const blocker = market.blocker && market.blocker.trim().length > 0 ? market.blocker.trim() : null;
  const hasDueDate = Boolean(market.nextActionDue && !Number.isNaN(new Date(market.nextActionDue).getTime()));

  const universeOrganizationId =
    Number.isInteger(market.universeOrganizationId) && market.universeOrganizationId > 0
      ? market.universeOrganizationId
      : null;
  const universeReference =
    universeOrganizationId === null
      ? MARKET_DETAIL_COPY.universeNotRecorded
      : `Universe #${universeOrganizationId}${market.schoolName ? ` · ${market.schoolName}` : ''}`;

  return {
    marketNumber: market.marketNumber,
    marketNumberDisplay: String(market.marketNumber).padStart(3, '0'),
    schoolName,
    location,
    stateLabel: humanizeState(market.state),
    priority: market.priority || MARKET_DETAIL_COPY.unknownPriority,
    owner: market.ownerName ?? (market.ownerId > 0 ? `User ${market.ownerId}` : MARKET_DETAIL_COPY.unassignedOwner),
    objective: market.objective || MARKET_DETAIL_COPY.noObjective,
    nextAction: market.nextAction || MARKET_DETAIL_COPY.noNextAction,
    hasNextAction: Boolean(market.nextAction),
    nextActionDueAbsolute: formatAbsolute(market.nextActionDue),
    nextActionDueLabel: hasDueDate ? dueLabel(market, now) : MARKET_DETAIL_COPY.noDueDate,
    hasDueDate,
    blocker,
    hasBlocker: blocker !== null,
    activatedAtAbsolute: formatAbsolute(market.activatedAt),
    universeOrganizationId,
    universeReference,
    revenue,
    hasRevenueData: Boolean(engine && (engine.teamUniforms || engine.lettered || engine.issue || engine.note)),
  };
}

/** True iff `state` is a canonical LETTERED lifecycle state (from @tuf/shared). */
export function isKnownLetteredState(state: string): boolean {
  return (LETTERED_STATES as readonly string[]).includes(state);
}

/** The canonical LETTERED main-chain lifecycle, re-exported for rendering. */
export const LETTERED_LIFECYCLE = LETTERED_LIFECYCLE_STATES;

export type LetteredPanelView =
  | { kind: 'loading' }
  | { kind: 'unavailable'; title: string; detail: string }
  | { kind: 'none'; title: string }
  | {
      kind: 'available';
      state: string;
      stateLabel: string;
      isKnownState: boolean;
      objective: string;
      nextAction: string;
      hasNextAction: boolean;
      nextActionDueAbsolute: string;
      nextActionDueLabel: string;
      hasDueDate: boolean;
      blocker: string | null;
      hasBlocker: boolean;
      lifecycle: readonly string[];
      deployment: LetteredDeploymentRecord;
    };

function letteredNextActionDueLabel(deployment: LetteredDeploymentRecord, now: Date): string {
  if (!deployment.nextActionDue) return MARKET_DETAIL_COPY.noDueDate;
  const due = new Date(deployment.nextActionDue);
  if (Number.isNaN(due.getTime())) return MARKET_DETAIL_COPY.noDueDate;
  const diffMs = due.getTime() - now.getTime();
  const days = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (diffMs < 0) return `Overdue ${Math.abs(days)}d`;
  if (days === 0) return 'Due today';
  return `In ${days}d`;
}

/**
 * Build the LETTERED deployment panel's view from a lookup result.
 *
 * `loading` short-circuits. A `null` lookup with `loading === false` is treated
 * as unavailable (defensive). `ok:false` is the honest "not yet available"
 * state; `ok:true, deployment:null` is the honest "none yet" state.
 */
export function buildLetteredPanel(
  lookup: LetteredLookup | null,
  loading: boolean,
  now: Date,
): LetteredPanelView {
  if (loading) return { kind: 'loading' };

  if (!lookup || lookup.ok === false) {
    return {
      kind: 'unavailable',
      title: MARKET_DETAIL_COPY.letteredUnavailable,
      detail: MARKET_DETAIL_COPY.letteredUnavailableDetail,
    };
  }

  if (lookup.deployment === null) {
    return { kind: 'none', title: MARKET_DETAIL_COPY.letteredNone };
  }

  const deployment = lookup.deployment;
  const hasDueDate = Boolean(deployment.nextActionDue && !Number.isNaN(new Date(deployment.nextActionDue).getTime()));
  const blocker = deployment.blocker && deployment.blocker.trim().length > 0 ? deployment.blocker.trim() : null;
  const isKnownState = isKnownLetteredState(deployment.state);

  return {
    kind: 'available',
    state: deployment.state,
    stateLabel: isKnownState ? humanizeState(deployment.state) : MARKET_DETAIL_COPY.unknownLifecycleState,
    isKnownState,
    objective: deployment.objective || MARKET_DETAIL_COPY.noObjective,
    nextAction: deployment.nextAction || MARKET_DETAIL_COPY.letteredNextActionNone,
    hasNextAction: Boolean(deployment.nextAction),
    nextActionDueAbsolute: formatAbsolute(deployment.nextActionDue),
    nextActionDueLabel: letteredNextActionDueLabel(deployment, now),
    hasDueDate,
    blocker,
    hasBlocker: blocker !== null,
    lifecycle: LETTERED_LIFECYCLE_STATES,
    deployment,
  };
}

/** One rendered summary row of the Drops commerce panel. */
export type DropsSummaryRow = {
  key: 'storefront' | 'orders' | 'orderValue' | 'units' | 'attribution';
  label: string;
  /** Display string — the honest "no data" copy when absent. */
  value: string;
  /** False when the backend did not report this metric (never a fake value). */
  hasValue: boolean;
};

export type DropsPanelView =
  | { kind: 'loading'; title: string }
  | { kind: 'unavailable'; title: string; detail: string }
  | { kind: 'none'; title: string; detail: string }
  | {
      kind: 'available';
      title: string;
      rows: DropsSummaryRow[];
      hasAnyValue: boolean;
      hasFetchedAt: boolean;
      fetchedAtAbsolute: string;
      asOfLabel: string;
      stale: boolean;
      statusLabel: string;
      statusTone: 'stale' | 'snapshot';
      readOnlyLabel: string;
      metric: MarketMetricRecord;
    };

/** Deterministic number rendering: no invented currency, no locale surprises. */
function formatMetricNumber(value: number): string {
  return String(value);
}

function storefrontValue(metric: MarketMetricRecord): string | null {
  const parts = [metric.storeStatus, metric.lifecycleStatus].filter(
    (part): part is string => typeof part === 'string' && part.length > 0,
  );
  // Collapse a duplicated status (store and lifecycle often carry the same word).
  const unique = parts.filter((part, index) => parts.indexOf(part) === index);
  return unique.length > 0 ? unique.join(' · ') : null;
}

/**
 * Build the Drops commerce panel's view from a MarketMetric lookup.
 *
 * `loading` short-circuits. A `null` lookup with `loading === false` is treated
 * as unavailable (defensive). `ok:false` is the honest "not yet available"
 * state; `ok:true, metric:null` is the honest "no snapshot yet" state. When a
 * snapshot is present, every metric is rendered from real data or the honest
 * "no data" copy — never a fabricated number and never a fake zero.
 */
export function buildDropsPanel(lookup: MetricsLookup | null, loading: boolean): DropsPanelView {
  if (loading) return { kind: 'loading', title: MARKET_DETAIL_COPY.dropsTitle };

  if (!lookup || lookup.ok === false) {
    return {
      kind: 'unavailable',
      title: MARKET_DETAIL_COPY.dropsUnavailable,
      detail: MARKET_DETAIL_COPY.dropsUnavailableDetail,
    };
  }

  if (lookup.metric === null) {
    return {
      kind: 'none',
      title: MARKET_DETAIL_COPY.dropsNone,
      detail: MARKET_DETAIL_COPY.dropsNoneDetail,
    };
  }

  const metric = lookup.metric;

  const storefront = storefrontValue(metric);
  const rows: DropsSummaryRow[] = [
    {
      key: 'storefront',
      label: 'Storefront / collection status',
      value: storefront ?? MARKET_DETAIL_COPY.dropsNoData,
      hasValue: storefront !== null,
    },
    {
      key: 'orders',
      label: 'Orders',
      value: metric.orderCount !== null ? formatMetricNumber(metric.orderCount) : MARKET_DETAIL_COPY.dropsNoData,
      hasValue: metric.orderCount !== null,
    },
    {
      key: 'orderValue',
      label: 'Order value (as reported by Drops)',
      value: metric.orderValue !== null ? formatMetricNumber(metric.orderValue) : MARKET_DETAIL_COPY.dropsNoData,
      hasValue: metric.orderValue !== null,
    },
    {
      key: 'units',
      label: 'Units',
      value: metric.units !== null ? formatMetricNumber(metric.units) : MARKET_DETAIL_COPY.dropsNoData,
      hasValue: metric.units !== null,
    },
    {
      key: 'attribution',
      label: 'Attribution',
      value: metric.attributionSummary ?? MARKET_DETAIL_COPY.dropsNoData,
      hasValue: metric.attributionSummary !== null,
    },
  ];

  const fetchedAtAbsolute = formatAbsolute(metric.fetchedAt);
  const hasFetchedAt = fetchedAtAbsolute !== '';
  const asOfLabel = hasFetchedAt
    ? `As of ${fetchedAtAbsolute}`
    : `As of ${MARKET_DETAIL_COPY.dropsNoSyncTime}`;

  return {
    kind: 'available',
    title: MARKET_DETAIL_COPY.dropsTitle,
    rows,
    hasAnyValue: rows.some((row) => row.hasValue),
    hasFetchedAt,
    fetchedAtAbsolute,
    asOfLabel,
    // Staleness is only ever the backend's call (metricsService.resolveStale).
    stale: metric.stale,
    statusLabel: metric.stale ? MARKET_DETAIL_COPY.dropsStale : MARKET_DETAIL_COPY.dropsSnapshot,
    statusTone: metric.stale ? 'stale' : 'snapshot',
    readOnlyLabel: MARKET_DETAIL_COPY.dropsReadOnly,
    metric,
  };
}
