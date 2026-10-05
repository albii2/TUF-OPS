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
  dropsNotWired: 'Drops OS commerce not yet wired',
  dropsNotWiredDetail:
    'Wave 4 connects the read-only Drops metrics (orders, revenue, AOV, attribution). Until then no commerce figure is shown — the contract forbids a fabricated number (R8).',
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

export type DropsPanelView = {
  title: string;
  status: 'NOT_WIRED';
  message: string;
  detail: string;
};

/**
 * The Drops commerce panel's honest state: not yet wired (Wave 4). It renders
 * the shape of what will arrive and explicitly says no figure is shown yet.
 * It never renders a number.
 */
export function buildDropsPanel(): DropsPanelView {
  return {
    title: MARKET_DETAIL_COPY.dropsTitle,
    status: 'NOT_WIRED',
    message: MARKET_DETAIL_COPY.dropsNotWired,
    detail: MARKET_DETAIL_COPY.dropsNotWiredDetail,
  };
}
