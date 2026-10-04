/**
 * TUF Ops 2.0 — Market state machine (plan §2.3).
 *
 * Typed enum + a transition guard table (not ad-hoc strings). The forward
 * chain is IDENTIFIED → … → MATURE; BLOCKED, PAUSED and KILLED are
 * interruption states reachable from any other state. KILLED is terminal.
 */

import { MarketState } from '../types/market.js';

export { MarketState } from '../types/market.js';

const FWD: readonly MarketState[] = [
  MarketState.IDENTIFIED,
  MarketState.QUALIFIED,
  MarketState.DEVELOPMENT,
  MarketState.LAUNCH_READY,
  MarketState.PENETRATION,
  MarketState.ACTIVE,
  MarketState.EXPANSION,
  MarketState.MATURE,
];

/**
 * Valid transitions, keyed by every `MarketState` (the `Record` type makes a
 * missing key a compile error). Interruption states may resume into any
 * forward state; KILLED has no outbound transitions.
 */
export const MARKET_TRANSITIONS: Readonly<
  Record<MarketState, readonly MarketState[]>
> = {
  [MarketState.IDENTIFIED]: [
    MarketState.QUALIFIED,
    MarketState.BLOCKED,
    MarketState.PAUSED,
    MarketState.KILLED,
  ],
  [MarketState.QUALIFIED]: [
    MarketState.DEVELOPMENT,
    MarketState.BLOCKED,
    MarketState.PAUSED,
    MarketState.KILLED,
  ],
  [MarketState.DEVELOPMENT]: [
    MarketState.LAUNCH_READY,
    MarketState.BLOCKED,
    MarketState.PAUSED,
    MarketState.KILLED,
  ],
  [MarketState.LAUNCH_READY]: [
    MarketState.PENETRATION,
    MarketState.BLOCKED,
    MarketState.PAUSED,
    MarketState.KILLED,
  ],
  [MarketState.PENETRATION]: [
    MarketState.ACTIVE,
    MarketState.BLOCKED,
    MarketState.PAUSED,
    MarketState.KILLED,
  ],
  [MarketState.ACTIVE]: [
    MarketState.EXPANSION,
    MarketState.BLOCKED,
    MarketState.PAUSED,
    MarketState.KILLED,
  ],
  [MarketState.EXPANSION]: [
    MarketState.MATURE,
    MarketState.BLOCKED,
    MarketState.PAUSED,
    MarketState.KILLED,
  ],
  [MarketState.MATURE]: [
    MarketState.BLOCKED,
    MarketState.PAUSED,
    MarketState.KILLED,
  ],
  [MarketState.BLOCKED]: [...FWD, MarketState.PAUSED, MarketState.KILLED],
  [MarketState.PAUSED]: [...FWD, MarketState.BLOCKED, MarketState.KILLED],
  [MarketState.KILLED]: [],
};

/** The activation-created entry state (ACTIVATE_MARKET_SPEC §6). */
export const MARKET_ENTRY_STATE: MarketState = MarketState.IDENTIFIED;

/** Terminal states — no outbound transitions. */
export const MARKET_TERMINAL_STATES: readonly MarketState[] = [MarketState.KILLED];

/**
 * Pure transition guard: true iff moving `from` → `to` is permitted by
 * `MARKET_TRANSITIONS`.
 */
export function canTransition(from: MarketState, to: MarketState): boolean {
  const allowed = MARKET_TRANSITIONS[from];
  return allowed !== undefined && allowed.includes(to);
}
