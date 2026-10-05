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
import { isStalled, sortMarketsByUrgency, urgencyOf } from '../markets/markets.view';

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
