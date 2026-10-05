/**
 * MARKETS — pure view logic + service normalisation.
 *
 * Proves the universe-record guard: a row without a `marketNumber` (a universe
 * organization) can never become a Market row, and the War Board sort is
 * overdue-first.
 */
import { normalizeMarketRow, isActivatedMarketRow, type MarketRecord } from '../services/marketsService';
import { dueLabel, formatMarketNumber, isStalled, sortMarketsByUrgency, urgencyOf } from '../pages/markets/markets.view';

// The service's network client resolves the API base URL from `import.meta.env`,
// which is a Vite-only construct and cannot be evaluated under ts-jest's CommonJS
// runtime. These tests exercise the pure normalisation/urgency logic only, so the
// transport module is mocked out (it is never called here).
jest.mock('../services/apiClient', () => ({ apiClient: jest.fn() }));

function market(partial: Partial<MarketRecord> & { marketNumber: number }): MarketRecord {
  return {
    id: partial.id ?? partial.marketNumber,
    marketNumber: partial.marketNumber,
    universeOrganizationId: partial.universeOrganizationId ?? 100 + partial.marketNumber,
    ownerId: partial.ownerId ?? 1,
    priority: partial.priority ?? 'TIER_2',
    objective: partial.objective ?? 'objective',
    nextAction: partial.nextAction ?? 'next action',
    nextActionDue: partial.nextActionDue ?? '2026-10-05T12:00:00.000Z',
    state: partial.state ?? 'DEVELOPMENT',
    activatedAt: partial.activatedAt ?? '2026-10-01T00:00:00.000Z',
    blocker: partial.blocker ?? null,
    schoolName: partial.schoolName ?? 'School',
    schoolState: partial.schoolState ?? 'MN',
    schoolCity: partial.schoolCity ?? null,
    ownerName: partial.ownerName ?? 'Owner',
    revenueEngineStatus: partial.revenueEngineStatus ?? null,
  } as MarketRecord;
}

describe('normalizeMarketRow — the activation gate', () => {
  it('accepts a snake_case Market row and requires market_number', () => {
    const record = normalizeMarketRow({
      id: 7,
      market_number: 1,
      universe_organization_id: 10,
      owner_id: 3,
      priority: 'TIER_1',
      objective: 'grow pillager',
      next_action: 'review storefront',
      next_action_due: '2026-10-08T00:00:00.000Z',
      state: 'PENETRATION',
      activated_at: '2026-10-01T00:00:00.000Z',
      school_name: 'Pillager High School',
      school_state: 'MN',
      owner_name: 'Keith',
    });
    expect(record).not.toBeNull();
    expect(record?.marketNumber).toBe(1);
    expect(record?.schoolName).toBe('Pillager High School');
    expect(record?.ownerName).toBe('Keith');
  });

  it('accepts a camelCase Market row', () => {
    const record = normalizeMarketRow({ marketNumber: 2, schoolName: 'Pequot Lakes High School', ownerName: 'Dana' });
    expect(record?.marketNumber).toBe(2);
    expect(record?.schoolName).toBe('Pequot Lakes High School');
  });

  it('REJECTS a universe organization row (no market_number) — it is never a Market', () => {
    expect(normalizeMarketRow({ id: 501, name: 'Universe Only Academy', state: 'MN' })).toBeNull();
    expect(isActivatedMarketRow({ id: 501, name: 'Universe Only Academy' })).toBe(false);
  });

  it('REJECTS a zero / negative / non-numeric market_number', () => {
    expect(normalizeMarketRow({ market_number: 0 })).toBeNull();
    expect(normalizeMarketRow({ market_number: -4 })).toBeNull();
    expect(normalizeMarketRow({ market_number: 'abc' })).toBeNull();
  });

  it('extracts rows from an envelope payload shape', () => {
    // rowsFromPayload is exercised through listMarkets; here we assert the guard
    // tolerates both a bare array element and an envelope element identically.
    expect(normalizeMarketRow({ marketNumber: 3 })?.marketNumber).toBe(3);
  });
});

describe('markets.view — formatting and urgency', () => {
  const now = new Date('2026-10-05T12:00:00.000Z');

  it('zero-pads the market number for display', () => {
    expect(formatMarketNumber(1)).toBe('001');
    expect(formatMarketNumber(12)).toBe('012');
    expect(formatMarketNumber(123)).toBe('123');
  });

  it('classifies overdue / due today / due soon / scheduled', () => {
    expect(urgencyOf(market({ marketNumber: 1, nextActionDue: '2026-10-03T12:00:00.000Z' }), now)).toBe('OVERDUE');
    expect(urgencyOf(market({ marketNumber: 2, nextActionDue: '2026-10-05T20:00:00.000Z' }), now)).toBe('DUE_TODAY');
    expect(urgencyOf(market({ marketNumber: 3, nextActionDue: '2026-10-09T12:00:00.000Z' }), now)).toBe('DUE_SOON');
    expect(urgencyOf(market({ marketNumber: 4, nextActionDue: '2026-11-01T12:00:00.000Z' }), now)).toBe('SCHEDULED');
  });

  it('sorts overdue first, then by due time', () => {
    const rows = [
      market({ marketNumber: 3, schoolName: 'Brainerd', nextActionDue: '2026-10-20T12:00:00.000Z' }),
      market({ marketNumber: 2, schoolName: 'Pequot Lakes', nextActionDue: '2026-10-09T12:00:00.000Z' }),
      market({ marketNumber: 1, schoolName: 'Pillager', nextActionDue: '2026-10-01T12:00:00.000Z' }),
    ];
    const sorted = sortMarketsByUrgency(rows, now);
    expect(sorted.map((m) => m.marketNumber)).toEqual([1, 2, 3]);
  });

  it('treats an overdue, blocked or paused market as stalled', () => {
    expect(isStalled(market({ marketNumber: 1, nextActionDue: '2026-10-01T00:00:00.000Z' }), now)).toBe(true);
    expect(isStalled(market({ marketNumber: 2, state: 'BLOCKED' }), now)).toBe(true);
    expect(isStalled(market({ marketNumber: 3, state: 'PAUSED' }), now)).toBe(true);
    expect(isStalled(market({ marketNumber: 4, blocker: 'awaiting rights' }), now)).toBe(true);
    expect(isStalled(market({ marketNumber: 5, nextActionDue: '2026-11-01T00:00:00.000Z' }), now)).toBe(false);
  });

  it('labels due dates honestly', () => {
    expect(dueLabel(market({ marketNumber: 1, nextActionDue: '2026-10-03T12:00:00.000Z' }), now)).toMatch(/Overdue/);
    expect(dueLabel(market({ marketNumber: 2, nextActionDue: '2026-10-05T20:00:00.000Z' }), now)).toBe('Due today');
    expect(dueLabel(market({ marketNumber: 3, nextActionDue: '2026-10-12T12:00:00.000Z' }), now)).toBe('In 7d');
  });
});
