/**
 * TUF Ops 2.0 — pure view logic for the MARKETS War Board.
 *
 * Kept free of React and of any network import so it can be unit-tested
 * directly, and so the sort/urgency rules are provable without a live API.
 */

import type { MarketRecord } from '../../services/marketsService';

export const MAX_DUE_SOON_DAYS = 7;

export type Urgency = 'OVERDUE' | 'DUE_TODAY' | 'DUE_SOON' | 'SCHEDULED' | 'NO_DUE';

const URGENCY_RANK: Record<Urgency, number> = {
  OVERDUE: 0,
  DUE_TODAY: 1,
  DUE_SOON: 2,
  SCHEDULED: 3,
  NO_DUE: 4,
};

/** `1` → `001` (display only; storage stays an integer). */
export function formatMarketNumber(value: number): string {
  return String(value).padStart(3, '0');
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * Urgency of a Market's next action relative to `now`.
 * `now` is injected so the rule is deterministic under test.
 */
export function urgencyOf(market: MarketRecord, now: Date): Urgency {
  if (!market.nextActionDue) return 'NO_DUE';
  const due = new Date(market.nextActionDue);
  if (Number.isNaN(due.getTime())) return 'NO_DUE';

  const today = startOfDay(now);
  const dueDay = startOfDay(due);

  if (due.getTime() < now.getTime()) return 'OVERDUE';
  if (dueDay === today) return 'DUE_TODAY';
  if (dueDay - today <= MAX_DUE_SOON_DAYS * DAY_MS) return 'DUE_SOON';
  return 'SCHEDULED';
}

/**
 * A Market is stalled if it is explicitly interrupted (BLOCKED / PAUSED), has
 * a recorded blocker, or its next action is overdue ("NO MARKET SITS WAITING").
 */
export function isStalled(market: MarketRecord, now: Date): boolean {
  if (market.state === 'BLOCKED' || market.state === 'PAUSED') return true;
  if (market.blocker && market.blocker.trim().length > 0) return true;
  return urgencyOf(market, now) === 'OVERDUE';
}

/**
 * War Board order: overdue first, then due today, then due soon, then the rest.
 * Ties break by due time, then by market number (stable).
 */
export function sortMarketsByUrgency(markets: readonly MarketRecord[], now: Date): MarketRecord[] {
  return [...markets].sort((a, b) => {
    const rankA = URGENCY_RANK[urgencyOf(a, now)];
    const rankB = URGENCY_RANK[urgencyOf(b, now)];
    if (rankA !== rankB) return rankA - rankB;

    const dueA = a.nextActionDue ? new Date(a.nextActionDue).getTime() : Number.POSITIVE_INFINITY;
    const dueB = b.nextActionDue ? new Date(b.nextActionDue).getTime() : Number.POSITIVE_INFINITY;
    const safeA = Number.isNaN(dueA) ? Number.POSITIVE_INFINITY : dueA;
    const safeB = Number.isNaN(dueB) ? Number.POSITIVE_INFINITY : dueB;
    if (safeA !== safeB) return safeA - safeB;

    return a.marketNumber - b.marketNumber;
  });
}

/** Human due label, e.g. `Overdue 2d`, `Due today`, `In 5d`. */
export function dueLabel(market: MarketRecord, now: Date): string {
  if (!market.nextActionDue) return 'No due date';
  const due = new Date(market.nextActionDue);
  if (Number.isNaN(due.getTime())) return 'No due date';

  const diffMs = due.getTime() - now.getTime();
  const days = Math.round(diffMs / DAY_MS);
  const urgency = urgencyOf(market, now);

  if (urgency === 'OVERDUE') return `Overdue ${Math.abs(days)}d`;
  if (urgency === 'DUE_TODAY') return 'Due today';
  if (days <= 0) return 'Due today';
  return `In ${days}d`;
}

/** Map a lifecycle state to a short human label (states stay canonical). */
export function lifecycleLabel(state: string): string {
  return state.split('_').join(' ');
}

/** Priority tone class, presentation only. */
export function priorityTone(priority: string): string {
  if (priority === 'TIER_1') return 'border-rose-500/50 text-rose-200';
  if (priority === 'TIER_2') return 'border-amber-500/50 text-amber-200';
  return 'border-slate-600 text-slate-300';
}

/** Urgency tone class, presentation only. */
export function urgencyTone(urgency: Urgency): string {
  if (urgency === 'OVERDUE') return 'border-rose-500/60 bg-rose-500/10 text-rose-200';
  if (urgency === 'DUE_TODAY') return 'border-amber-500/60 bg-amber-500/10 text-amber-100';
  if (urgency === 'DUE_SOON') return 'border-sky-500/50 bg-sky-500/10 text-sky-100';
  return 'border-slate-600 text-slate-300';
}
