/**
 * TUF Ops 2.0 — ISSUE state machine (plan §2.3).
 *
 * The institutional/program apparel lifecycle (coaches, travel, player gear).
 * The plan's ISSUE lifecycle has NO interruption states: it is a strict linear
 * chain ending at EXPANSION (terminal).
 */

import { IssueState } from '../types/revenue-opportunity.js';

export { IssueState } from '../types/revenue-opportunity.js';

/**
 * Valid transitions, keyed by every `IssueState`. The `Record` type makes a
 * missing key a compile error. EXPANSION is terminal.
 */
export const ISSUE_TRANSITIONS: Readonly<
  Record<IssueState, readonly IssueState[]>
> = {
  [IssueState.IDENTIFIED]: [IssueState.NEEDS_ASSESSMENT],
  [IssueState.NEEDS_ASSESSMENT]: [IssueState.PROGRAM_DESIGN],
  [IssueState.PROGRAM_DESIGN]: [IssueState.QUOTE],
  [IssueState.QUOTE]: [IssueState.DECISION],
  [IssueState.DECISION]: [IssueState.WON],
  [IssueState.WON]: [IssueState.PRODUCTION],
  [IssueState.PRODUCTION]: [IssueState.DELIVERED],
  [IssueState.DELIVERED]: [IssueState.EXPANSION],
  [IssueState.EXPANSION]: [],
};

/** Entry state of the ISSUE lifecycle. */
export const ISSUE_ENTRY_STATE: IssueState = IssueState.IDENTIFIED;

/** Terminal states — no outbound transitions. */
export const ISSUE_TERMINAL_STATES: readonly IssueState[] = [IssueState.EXPANSION];

/**
 * Pure transition guard: true iff moving `from` → `to` is permitted by
 * `ISSUE_TRANSITIONS`.
 */
export function canTransition(from: IssueState, to: IssueState): boolean {
  const allowed = ISSUE_TRANSITIONS[from];
  return allowed !== undefined && allowed.includes(to);
}
