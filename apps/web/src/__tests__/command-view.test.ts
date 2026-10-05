/**
 * COMMAND — brief logic. Proves the surface is actionable and that its empty
 * states are honest: a zero collection yields copy, never a fake number.
 *
 * The command service's network client resolves its base URL from
 * `import.meta.env` (Vite-only) which ts-jest's CommonJS runtime cannot
 * evaluate, so the transport module is mocked out — mirroring the MARKETS
 * War Board and LETTERED / MarketMetric suites.
 */
jest.mock('../services/apiClient', () => ({ apiClient: jest.fn() }));

import type { MarketRecord } from '../services/marketsService';
import type { CommandObligation } from '../services/commandService';
import { normalizeCommandObligation, obligationsFromPayload } from '../services/commandService';
import {
  buildCommandBrief,
  buildCommandQueue,
  COMMAND_COPY,
  COMMAND_QUEUE_COPY,
  deadlineLabel,
  deadlineUrgency,
  toObligationView,
} from '../pages/command/command.view';

function market(partial: Partial<MarketRecord> & { marketNumber: number }): MarketRecord {
  return {
    id: partial.id ?? partial.marketNumber,
    marketNumber: partial.marketNumber,
    universeOrganizationId: 100 + partial.marketNumber,
    ownerId: 1,
    priority: 'TIER_2',
    objective: 'objective',
    nextAction: 'next action',
    nextActionDue: '2026-11-01T12:00:00.000Z',
    state: 'DEVELOPMENT',
    activatedAt: '2026-10-01T00:00:00.000Z',
    blocker: null,
    schoolName: 'School',
    schoolState: 'MN',
    schoolCity: null,
    ownerName: 'Owner',
    revenueEngineStatus: null,
    ...partial,
  } as MarketRecord;
}

const now = new Date('2026-10-05T12:00:00.000Z');

describe('buildCommandBrief', () => {
  it('answers "what requires action today" with overdue + due-today markets, overdue first', () => {
    const brief = buildCommandBrief(
      [
        market({ marketNumber: 1, nextActionDue: '2026-10-01T12:00:00.000Z' }),
        market({ marketNumber: 2, nextActionDue: '2026-10-05T20:00:00.000Z' }),
        market({ marketNumber: 3, nextActionDue: '2026-11-01T12:00:00.000Z' }),
      ],
      now,
    );
    expect(brief.requiresActionToday.map((m) => m.marketNumber)).toEqual([1, 2]);
    expect(brief.nextBestAction?.market.marketNumber).toBe(1);
  });

  it('separates advancing from stalled', () => {
    const brief = buildCommandBrief(
      [
        market({ marketNumber: 1, nextActionDue: '2026-10-01T12:00:00.000Z' }), // overdue → stalled
        market({ marketNumber: 2, state: 'BLOCKED' }), // stalled
        market({ marketNumber: 3, nextActionDue: '2026-11-01T12:00:00.000Z' }), // advancing
      ],
      now,
    );
    expect(brief.stalled.map((m) => m.marketNumber)).toEqual([1, 2]);
    expect(brief.advancing.map((m) => m.marketNumber)).toEqual([3]);
  });

  it('reports revenue only when real engine status exists — never fabricates', () => {
    const none = buildCommandBrief([market({ marketNumber: 1 })], now);
    expect(none.revenue.hasData).toBe(false);
    expect(none.revenue.rows).toHaveLength(0);

    const some = buildCommandBrief(
      [market({ marketNumber: 1, revenueEngineStatus: { teamUniforms: 'ACTIVE', lettered: 'LIVE', issue: null, note: null } })],
      now,
    );
    expect(some.revenue.hasData).toBe(true);
    expect(some.revenue.rows[0].lettered).toBe('LIVE');
  });

  it('yields honest empty states when nothing requires action', () => {
    const brief = buildCommandBrief([market({ marketNumber: 1, nextActionDue: '2026-11-01T12:00:00.000Z' })], now);
    expect(brief.requiresActionToday).toHaveLength(0);
    expect(brief.stalled).toHaveLength(0);
    expect(COMMAND_COPY.noActionRequired).toBe('No action required');
    // no fabricated next action, but a real advancing market still gives one
    expect(brief.nextBestAction?.market.marketNumber).toBe(1);
    expect(brief.nextBestAction?.reason).toMatch(/advancing/i);
  });

  it('ignores universe rows (no marketNumber) entirely', () => {
    const universeRow = { name: 'Universe Only Academy', state: 'MN' } as unknown as MarketRecord;
    const brief = buildCommandBrief([universeRow, market({ marketNumber: 1 })], now);
    expect(brief.totalMarkets).toBe(1);
    expect(brief.advancing).toHaveLength(1);
  });

  it('returns a null next best action only when there are no markets at all', () => {
    const brief = buildCommandBrief([], now);
    expect(brief.totalMarkets).toBe(0);
    expect(brief.nextBestAction).toBeNull();
  });
});

/* ------------------------------------------------------------------------- *
 * Wave 5B — the endpoint-driven COMMAND queue.
 * ------------------------------------------------------------------------- */

function obligation(partial: Partial<CommandObligation> & { marketNumber: number }): CommandObligation {
  return {
    id: String(partial.marketNumber),
    marketNumber: partial.marketNumber,
    marketId: partial.marketNumber,
    schoolName: 'School',
    state: 'DEVELOPMENT',
    objective: 'objective',
    ownerId: 1,
    ownerName: 'Owner',
    nextAction: 'next action',
    nextActionDue: '2026-11-01T12:00:00.000Z',
    blocker: null,
    priority: null,
    taskId: null,
    taskType: null,
    ...partial,
  };
}

function readyQueue(obligations: CommandObligation[], at = now) {
  const queue = buildCommandQueue({ ok: true, obligations }, false, at);
  expect(queue.kind).toBe('ready');
  if (queue.kind !== 'ready') throw new Error('expected ready queue');
  return queue;
}

describe('deadlineUrgency / deadlineLabel (mirrors the War Board rule)', () => {
  it('classifies overdue, due today, due soon and scheduled', () => {
    expect(deadlineUrgency('2026-10-01T12:00:00.000Z', now)).toBe('OVERDUE');
    expect(deadlineUrgency('2026-10-05T20:00:00.000Z', now)).toBe('DUE_TODAY');
    expect(deadlineUrgency('2026-10-08T12:00:00.000Z', now)).toBe('DUE_SOON');
    expect(deadlineUrgency('2026-11-01T12:00:00.000Z', now)).toBe('SCHEDULED');
    expect(deadlineUrgency('', now)).toBe('NO_DUE');
    expect(deadlineUrgency('not-a-date', now)).toBe('NO_DUE');
  });

  it('labels deadlines honestly', () => {
    expect(deadlineLabel('2026-10-01T12:00:00.000Z', now)).toBe('Overdue 4d');
    expect(deadlineLabel('2026-10-05T20:00:00.000Z', now)).toBe('Due today');
    expect(deadlineLabel('2026-10-09T12:00:00.000Z', now)).toBe('In 4d');
    expect(deadlineLabel('', now)).toBe(COMMAND_QUEUE_COPY.noDeadline);
  });
});

describe('buildCommandQueue — (a) overdue sorts before due-today before upcoming', () => {
  it('orders the queue overdue → due today → upcoming', () => {
    const queue = readyQueue([
      obligation({ marketNumber: 30, nextActionDue: '2026-11-01T12:00:00.000Z' }), // upcoming
      obligation({ marketNumber: 10, nextActionDue: '2026-10-01T12:00:00.000Z' }), // overdue
      obligation({ marketNumber: 20, nextActionDue: '2026-10-05T20:00:00.000Z' }), // due today
      obligation({ marketNumber: 40, nextActionDue: '2026-10-07T12:00:00.000Z' }), // due soon
    ]);

    expect(queue.ordered.map((r) => r.marketNumber)).toEqual([10, 20, 40, 30]);
    expect(queue.overdue.map((r) => r.marketNumber)).toEqual([10]);
    expect(queue.dueToday.map((r) => r.marketNumber)).toEqual([20]);
    expect(queue.upcoming.map((r) => r.marketNumber)).toEqual([40, 30]);
    expect(queue.total).toBe(4);
  });

  it('breaks ties within a band by deadline, then by market number', () => {
    const queue = readyQueue([
      obligation({ marketNumber: 3, nextActionDue: '2026-10-01T12:00:00.000Z' }),
      obligation({ marketNumber: 1, nextActionDue: '2026-10-02T12:00:00.000Z' }),
      obligation({ marketNumber: 2, nextActionDue: '2026-10-02T12:00:00.000Z' }),
    ]);
    // #3 has the earlier deadline (2026-10-01); #1 and #2 share 2026-10-02 and
    // are therefore ordered by market number.
    expect(queue.overdue.map((r) => r.marketNumber)).toEqual([3, 1, 2]);
  });
});

describe('buildCommandQueue — (b) every rendered obligation resolves all six fields', () => {
  it('shows state, objective, owner, next action, deadline and blocker', () => {
    const queue = readyQueue([
      obligation({
        marketNumber: 1,
        state: 'LETTERED_LIVE',
        objective: 'Sell the fall drop',
        ownerName: 'Keith',
        nextAction: 'Publish the storefront',
        nextActionDue: '2026-10-09T12:00:00.000Z',
        blocker: 'Awaiting rights clearance',
      }),
    ]);

    const row = queue.ordered[0];
    expect(row.state).toBe('LETTERED_LIVE');
    expect(row.objective).toBe('Sell the fall drop');
    expect(row.owner).toBe('Keith');
    expect(row.nextAction).toBe('Publish the storefront');
    expect(row.hasNextAction).toBe(true);
    expect(row.deadlineLabel).toBe('In 4d');
    expect(row.deadlineAbsolute).toBe('2026-10-09');
    expect(row.hasDeadline).toBe(true);
    expect(row.blocker).toBe('Awaiting rights clearance');
    expect(row.hasBlocker).toBe(true);
    expect(row.marketNumberDisplay).toBe('001');
  });

  it('never renders a blank field — absent fields become honest words', () => {
    const row = toObligationView(
      obligation({ marketNumber: 1, state: null, objective: null, ownerId: null, ownerName: null, blocker: null }),
      now,
    );
    expect(row.state).toBe(COMMAND_QUEUE_COPY.noState);
    expect(row.hasState).toBe(false);
    expect(row.objective).toBe(COMMAND_QUEUE_COPY.noObjective);
    expect(row.hasObjective).toBe(false);
    expect(row.owner).toBe(COMMAND_QUEUE_COPY.noOwner);
    expect(row.hasOwner).toBe(false);
    expect(row.blocker).toBe(COMMAND_QUEUE_COPY.noBlocker);
    expect(row.hasBlocker).toBe(false);
  });

  it('falls back to an owner id when only an id is reported', () => {
    const row = toObligationView(obligation({ marketNumber: 1, ownerName: null, ownerId: 7 }), now);
    expect(row.owner).toBe('Owner #7');
    expect(row.hasOwner).toBe(true);
  });
});

describe('buildCommandQueue — a market with no next action is never shown as actionable', () => {
  it('separates no-next-action markets out of overdue/due/upcoming', () => {
    const queue = readyQueue([
      obligation({ marketNumber: 1, nextAction: null, nextActionDue: '2026-10-01T12:00:00.000Z' }),
    ]);
    expect(queue.noAction.map((r) => r.marketNumber)).toEqual([1]);
    expect(queue.overdue).toHaveLength(0);
    expect(queue.dueToday).toHaveLength(0);
    expect(queue.upcoming).toHaveLength(0);

    const row = queue.noAction[0];
    expect(row.hasNextAction).toBe(false);
    expect(row.nextAction).toBe(COMMAND_QUEUE_COPY.noNextAction);
    expect(row.urgency).toBe('NO_DUE');
  });

  it('orders no-action rows after every actionable band', () => {
    const queue = readyQueue([
      obligation({ marketNumber: 5, nextAction: null }),
      obligation({ marketNumber: 1, nextActionDue: '2026-10-01T12:00:00.000Z' }),
    ]);
    expect(queue.ordered.map((r) => r.marketNumber)).toEqual([1, 5]);
  });
});

describe('buildCommandQueue — (c) missing/failing endpoint → honest "not yet available"', () => {
  it('renders unavailable with no rows and no numbers (never throws)', () => {
    const queue = buildCommandQueue({ ok: false, error: 'API request failed: 404' }, false, now);
    expect(queue.kind).toBe('unavailable');
    if (queue.kind === 'unavailable') {
      expect(queue.title).toBe(COMMAND_QUEUE_COPY.unavailableTitle);
      expect(queue.detail).toMatch(/not answering yet/i);
      // There is no row collection and therefore no number to leak.
      expect('ordered' in queue).toBe(false);
      expect('total' in queue).toBe(false);
    }
  });

  it('treats a null lookup (not loading) as unavailable too', () => {
    expect(buildCommandQueue(null, false, now).kind).toBe('unavailable');
  });

  it('short-circuits to loading before anything else', () => {
    expect(buildCommandQueue(null, true, now).kind).toBe('loading');
    expect(buildCommandQueue({ ok: true, obligations: [] }, true, now).kind).toBe('loading');
  });
});

describe('buildCommandQueue — (d) genuinely empty → honest empty state, no fake 0', () => {
  it('renders the empty state with no rows and no total', () => {
    const queue = buildCommandQueue({ ok: true, obligations: [] }, false, now);
    expect(queue.kind).toBe('empty');
    if (queue.kind === 'empty') {
      expect(queue.title).toBe('No action required');
      expect('ordered' in queue).toBe(false);
      expect('total' in queue).toBe(false);
    }
  });
});

describe('buildCommandQueue — (e) a universe-only record is never a Market', () => {
  it('drops universe rows and renders only the real activation', () => {
    const obligations = obligationsFromPayload({
      tasks: [
        { name: 'Universe Only Academy', state: 'MN' }, // no marketNumber → not a market
        {
          market_number: 2,
          school_name: 'Pequot Lakes',
          state: 'DEVELOPMENT',
          objective: 'Launch prep',
          next_action: 'Confirm launch date',
          next_action_due: '2026-11-01T12:00:00.000Z',
        },
      ],
    })
      .map(normalizeCommandObligation)
      .filter((row): row is CommandObligation => row !== null);

    const queue = readyQueue(obligations);
    expect(queue.total).toBe(1);
    expect(queue.ordered.map((r) => r.marketNumber)).toEqual([2]);
    expect(queue.ordered[0].schoolName).toBe('Pequot Lakes');
  });
});
