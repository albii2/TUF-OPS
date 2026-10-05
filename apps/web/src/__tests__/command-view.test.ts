/**
 * COMMAND — brief logic. Proves the surface is actionable and that its empty
 * states are honest: a zero collection yields copy, never a fake number.
 */
import type { MarketRecord } from '../services/marketsService';
import { buildCommandBrief, COMMAND_COPY } from '../pages/command/command.view';

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
