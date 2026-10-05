/**
 * TUF Ops 2.0 — COMMAND brief (pure logic).
 *
 * COMMAND is an ACTIONABLE operating surface, not a vanity dashboard. It is
 * driven entirely by real 2.0 state (the activated Markets and their
 * obligations). Nothing here is fabricated: every count is a length of a real
 * collection, and every empty collection renders honest empty copy rather than
 * a zero that looks like data.
 *
 * It answers, on one screen:
 *   1. What requires action today?   -> requiresActionToday
 *   2. Which markets are advancing?  -> advancing
 *   3. Which are stalled?            -> stalled
 *   4. Where is revenue?             -> revenue
 *   5. What is the next best action? -> nextBestAction
 */

import type { MarketRecord } from '../../services/marketsService';
import type { CommandLookup, CommandObligation } from '../../services/commandService';
import { formatMarketNumber, isStalled, sortMarketsByUrgency, urgencyOf, type Urgency } from '../markets/markets.view';

export type RevenueRow = { market: MarketRecord; teamUniforms: string | null; lettered: string | null; issue: string | null; note: string | null };

export type CommandBrief = {
  requiresActionToday: MarketRecord[];
  advancing: MarketRecord[];
  stalled: MarketRecord[];
  revenue: { hasData: boolean; rows: RevenueRow[] };
  nextBestAction: { market: MarketRecord; reason: string } | null;
  totalMarkets: number;
};

/** Honest empty-state copy. A zero row count never renders a number. */
export const COMMAND_COPY = {
  noActionRequired: 'No action required',
  noActionDetail: 'Every activated market has a next action due later than today.',
  noAdvancing: 'No markets advancing',
  noStalled: 'Nothing stalled',
  noStalledDetail: 'No market is blocked, paused, or overdue.',
  noRevenue: 'No revenue engine data available yet',
  noRevenueDetail: 'Revenue signals arrive when the LETTERED / revenue engines report. Nothing is shown rather than a placeholder number.',
  noNextAction: 'No next action',
} as const;

function currentMarkets(markets: readonly MarketRecord[]): MarketRecord[] {
  return markets.filter((m) => m.marketNumber > 0);
}

/**
 * Build the COMMAND brief from real Market state. `now` is injected so the
 * "today" boundary is deterministic under test.
 */
export function buildCommandBrief(markets: readonly MarketRecord[], now: Date): CommandBrief {
  const valid = currentMarkets(markets);
  const ordered = sortMarketsByUrgency(valid, now);

  const requiresActionToday = ordered.filter((m) => {
    const urgency = urgencyOf(m, now);
    return urgency === 'OVERDUE' || urgency === 'DUE_TODAY';
  });

  const stalled = ordered.filter((m) => isStalled(m, now));
  const advancing = ordered.filter((m) => !isStalled(m, now));

  const rows: RevenueRow[] = valid
    .filter((m) => m.revenueEngineStatus !== null)
    .map((m) => ({
      market: m,
      teamUniforms: m.revenueEngineStatus?.teamUniforms ?? null,
      lettered: m.revenueEngineStatus?.lettered ?? null,
      issue: m.revenueEngineStatus?.issue ?? null,
      note: m.revenueEngineStatus?.note ?? null,
    }));

  let nextBestAction: CommandBrief['nextBestAction'] = null;
  if (requiresActionToday.length > 0) {
    const market = requiresActionToday[0];
    const urgency = urgencyOf(market, now);
    nextBestAction = {
      market,
      reason: urgency === 'OVERDUE' ? 'Overdue next action — clear it first.' : 'Next action due today.',
    };
  } else if (stalled.length > 0) {
    nextBestAction = {
      market: stalled[0],
      reason: stalled[0].blocker ? `Blocked: ${stalled[0].blocker}` : 'Stalled — needs attention.',
    };
  } else if (advancing.length > 0) {
    nextBestAction = { market: advancing[0], reason: 'Keep the market advancing.' };
  }

  return {
    requiresActionToday,
    advancing,
    stalled,
    revenue: { hasData: rows.length > 0, rows },
    nextBestAction,
    totalMarkets: valid.length,
  };
}

/* ------------------------------------------------------------------------- *
 * Wave 5B — the real, endpoint-driven COMMAND queue.
 *
 * COMMAND answers "what needs to be done today?" from GET /api/v1/tasks/command.
 * It orders overdue first, then due today, then upcoming, and renders each
 * obligation as STATE -> OBJECTIVE -> OWNER -> NEXT ACTION -> DEADLINE ->
 * BLOCKER. It is honest at every boundary: no fabricated row (a missing
 * endpoint yields "not yet available"), no fabricated number, an explicit
 * empty state, and a Market with no next action is never shown as actionable.
 * ------------------------------------------------------------------------- */

/** Honest copy for the endpoint-driven queue. A zero row count never renders a number. */
export const COMMAND_QUEUE_COPY = {
  loading: 'Loading command state…',
  unavailableTitle: 'Command queue not yet available',
  unavailableDetail:
    'The task/command endpoint is not answering yet. Nothing is shown rather than tasks that are not real.',
  emptyTitle: 'No action required',
  emptyDetail:
    'No obligation is waiting right now. When an active market has work that is due, it will appear here.',
  overdueHeading: 'Overdue',
  dueTodayHeading: 'Due today',
  upcomingHeading: 'Upcoming',
  noActionHeading: 'No next action recorded',
  noActionDetail:
    'These markets are active but have no next action recorded. They are shown separately — never as if they had one.',
  state: 'State',
  objective: 'Objective',
  owner: 'Owner',
  nextAction: 'Next action',
  deadline: 'Deadline',
  blocker: 'Blocker',
  noState: 'State not reported',
  noObjective: 'No objective recorded',
  noOwner: 'Unassigned',
  noNextAction: 'No next action recorded',
  noDeadline: 'No deadline',
  noBlocker: 'No blocker',
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DUE_SOON_DAYS = 7;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * Urgency of an obligation's deadline relative to `now`. Mirrors the MARKETS
 * War Board rule so the two surfaces agree on what "overdue" means. `now` is
 * injected so the boundary is deterministic under test.
 */
export function deadlineUrgency(due: string, now: Date): Urgency {
  if (!due) return 'NO_DUE';
  const date = new Date(due);
  if (Number.isNaN(date.getTime())) return 'NO_DUE';

  const today = startOfDay(now);
  const dueDay = startOfDay(date);

  if (date.getTime() < now.getTime()) return 'OVERDUE';
  if (dueDay === today) return 'DUE_TODAY';
  if (dueDay - today <= MAX_DUE_SOON_DAYS * DAY_MS) return 'DUE_SOON';
  return 'SCHEDULED';
}

/** Human deadline label, e.g. `Overdue 2d`, `Due today`, `In 5d`. */
export function deadlineLabel(due: string, now: Date): string {
  if (!due) return COMMAND_QUEUE_COPY.noDeadline;
  const date = new Date(due);
  if (Number.isNaN(date.getTime())) return COMMAND_QUEUE_COPY.noDeadline;

  const days = Math.round((date.getTime() - now.getTime()) / DAY_MS);
  const urgency = deadlineUrgency(due, now);

  if (urgency === 'OVERDUE') return `Overdue ${Math.abs(days)}d`;
  if (urgency === 'DUE_TODAY') return 'Due today';
  if (days <= 0) return 'Due today';
  return `In ${days}d`;
}

/** One obligation, shaped for rendering. All six fields are always present. */
export type ObligationView = {
  id: string;
  marketNumber: number;
  /** Zero-padded display number, e.g. `001`. */
  marketNumberDisplay: string;
  schoolName: string;
  hasSchoolName: boolean;
  marketPath: string;

  state: string;
  hasState: boolean;
  objective: string;
  hasObjective: boolean;
  owner: string;
  hasOwner: boolean;
  nextAction: string;
  hasNextAction: boolean;
  /** Raw ISO deadline, or '' when absent. */
  deadline: string;
  hasDeadline: boolean;
  deadlineLabel: string;
  deadlineAbsolute: string;
  blocker: string;
  hasBlocker: boolean;

  urgency: Urgency;
};

export type CommandQueueReady = {
  kind: 'ready';
  overdue: ObligationView[];
  dueToday: ObligationView[];
  upcoming: ObligationView[];
  /** Active markets with no next action recorded — never shown as actionable. */
  noAction: ObligationView[];
  /** Overdue → due today → upcoming → no-action. The render order. */
  ordered: ObligationView[];
  /** Real obligation count from the endpoint. Never a fabricated number. */
  total: number;
};

export type CommandQueue =
  | { kind: 'loading' }
  | { kind: 'unavailable'; title: string; detail: string }
  | { kind: 'empty'; title: string; detail: string }
  | CommandQueueReady;

function ownerLabel(obligation: CommandObligation): { value: string; present: boolean } {
  if (obligation.ownerName) return { value: obligation.ownerName, present: true };
  if (obligation.ownerId !== null) return { value: `Owner #${obligation.ownerId}`, present: true };
  return { value: COMMAND_QUEUE_COPY.noOwner, present: false };
}

/** Project one normalised obligation into a fully-populated render view. */
export function toObligationView(obligation: CommandObligation, now: Date): ObligationView {
  const hasState = obligation.state !== null && obligation.state.trim().length > 0;
  const hasObjective = obligation.objective !== null && obligation.objective.trim().length > 0;
  const hasNextAction = obligation.nextAction !== null && obligation.nextAction.trim().length > 0;
  const hasBlocker = obligation.blocker !== null && obligation.blocker.trim().length > 0;
  const hasDeadline =
    obligation.nextActionDue.length > 0 && !Number.isNaN(new Date(obligation.nextActionDue).getTime());

  // A Market with no next action is never ranked as due; it is separated out so
  // it can never render as if it had an action to do.
  const urgency: Urgency = hasNextAction && hasDeadline ? deadlineUrgency(obligation.nextActionDue, now) : 'NO_DUE';

  const owner = ownerLabel(obligation);
  const hasSchoolName = obligation.schoolName !== null && obligation.schoolName.trim().length > 0;

  return {
    id: obligation.id ?? `market-${obligation.marketNumber}`,
    marketNumber: obligation.marketNumber,
    marketNumberDisplay: formatMarketNumber(obligation.marketNumber),
    schoolName: hasSchoolName ? (obligation.schoolName as string) : 'Market',
    hasSchoolName,
    marketPath: `/ops/markets/${obligation.marketNumber}`,

    state: hasState ? (obligation.state as string) : COMMAND_QUEUE_COPY.noState,
    hasState,
    objective: hasObjective ? (obligation.objective as string) : COMMAND_QUEUE_COPY.noObjective,
    hasObjective,
    owner: owner.value,
    hasOwner: owner.present,
    nextAction: hasNextAction ? (obligation.nextAction as string) : COMMAND_QUEUE_COPY.noNextAction,
    hasNextAction,
    deadline: obligation.nextActionDue,
    hasDeadline,
    deadlineLabel: hasDeadline ? deadlineLabel(obligation.nextActionDue, now) : COMMAND_QUEUE_COPY.noDeadline,
    deadlineAbsolute: hasDeadline ? new Date(obligation.nextActionDue).toISOString().slice(0, 10) : '',
    blocker: hasBlocker ? (obligation.blocker as string) : COMMAND_QUEUE_COPY.noBlocker,
    hasBlocker,

    urgency,
  };
}

const URGENCY_RANK: Record<Urgency, number> = {
  OVERDUE: 0,
  DUE_TODAY: 1,
  DUE_SOON: 2,
  SCHEDULED: 3,
  NO_DUE: 4,
};

function byDeadlineThenMarket(a: ObligationView, b: ObligationView): number {
  const rank = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
  if (rank !== 0) return rank;

  const dueA = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
  const dueB = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
  const safeA = Number.isNaN(dueA) ? Number.POSITIVE_INFINITY : dueA;
  const safeB = Number.isNaN(dueB) ? Number.POSITIVE_INFINITY : dueB;
  if (safeA !== safeB) return safeA - safeB;

  return a.marketNumber - b.marketNumber;
}

/**
 * Build the COMMAND queue from the endpoint lookup. `lookup === null` while not
 * loading means the endpoint has not answered — that is honest "unavailable",
 * never an empty queue (which would falsely read as "nothing to do").
 */
export function buildCommandQueue(lookup: CommandLookup | null, loading: boolean, now: Date): CommandQueue {
  if (loading) return { kind: 'loading' };

  if (lookup === null || !lookup.ok) {
    return {
      kind: 'unavailable',
      title: COMMAND_QUEUE_COPY.unavailableTitle,
      detail: COMMAND_QUEUE_COPY.unavailableDetail,
    };
  }

  if (lookup.obligations.length === 0) {
    return {
      kind: 'empty',
      title: COMMAND_QUEUE_COPY.emptyTitle,
      detail: COMMAND_QUEUE_COPY.emptyDetail,
    };
  }

  const views = lookup.obligations.map((obligation) => toObligationView(obligation, now));

  // No-next-action obligations are separated FIRST so they can never be ranked
  // as due work, then one ordered, urgency-first list is produced.
  const noAction = views.filter((view) => !view.hasNextAction).sort(byDeadlineThenMarket);
  const actionable = views.filter((view) => view.hasNextAction).sort(byDeadlineThenMarket);

  const overdue = actionable.filter((view) => view.urgency === 'OVERDUE');
  const dueToday = actionable.filter((view) => view.urgency === 'DUE_TODAY');
  const upcoming = actionable.filter(
    (view) => view.urgency === 'DUE_SOON' || view.urgency === 'SCHEDULED' || view.urgency === 'NO_DUE',
  );

  return {
    kind: 'ready',
    overdue,
    dueToday,
    upcoming,
    noAction,
    ordered: [...overdue, ...dueToday, ...upcoming, ...noAction],
    total: views.length,
  };
}
