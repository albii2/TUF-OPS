/**
 * MARKET DETAIL — pure view logic (Wave 3B).
 *
 * Proves the acceptance rules:
 *   - a market WITH a marketNumber renders as a market;
 *   - a universe-only record (no marketNumber) is NEVER rendered as a market;
 *   - next_action + due date render, and the blocker shows when set;
 *   - a missing/failed LETTERED endpoint renders honest "not yet available";
 *   - empty states are honest words, never a fabricated 0.
 */
import type { MarketRecord } from '../services/marketsService';
import type { LetteredLookup } from '../services/letteredService';
import {
  MARKET_DETAIL_COPY,
  buildDropsPanel,
  buildLetteredPanel,
  buildMarketDetail,
  isKnownLetteredState,
  isMarketRecord,
} from '../pages/markets/marketDetail.view';

function market(partial: Partial<MarketRecord> & { marketNumber: number }): MarketRecord {
  return {
    id: partial.id ?? partial.marketNumber,
    marketNumber: partial.marketNumber,
    universeOrganizationId: partial.universeOrganizationId ?? 100 + partial.marketNumber,
    ownerId: partial.ownerId ?? 7,
    priority: partial.priority ?? 'TIER_1',
    objective: partial.objective ?? 'Grow the Pillager market',
    nextAction: partial.nextAction ?? 'Review storefront copy',
    nextActionDue: partial.nextActionDue ?? '2026-10-09T12:00:00.000Z',
    state: partial.state ?? 'DEVELOPMENT',
    activatedAt: partial.activatedAt ?? '2026-10-01T00:00:00.000Z',
    blocker: partial.blocker ?? null,
    schoolName: partial.schoolName ?? 'Pillager High School',
    schoolState: partial.schoolState ?? 'MN',
    schoolCity: partial.schoolCity ?? 'Pillager',
    ownerName: partial.ownerName ?? 'Keith',
    revenueEngineStatus: partial.revenueEngineStatus ?? null,
  } as MarketRecord;
}

const now = new Date('2026-10-05T12:00:00.000Z');

describe('the activation gate — a record without a marketNumber is not a market', () => {
  it('accepts a record WITH a marketNumber', () => {
    expect(isMarketRecord(market({ marketNumber: 1 }))).toBe(true);
    expect(buildMarketDetail(market({ marketNumber: 1 }), now)).not.toBeNull();
  });

  it('REJECTS a universe-only record (no marketNumber) — it is never a market', () => {
    expect(isMarketRecord({ id: 501, name: 'Universe Only Academy', state: 'MN' })).toBe(false);
    expect(isMarketRecord({ marketNumber: 0 })).toBe(false);
    expect(isMarketRecord({ marketNumber: -2 })).toBe(false);
    expect(isMarketRecord(null)).toBe(false);
    // The detail builder refuses to produce a market view for it.
    expect(buildMarketDetail({ name: 'Universe Only Academy' } as unknown as MarketRecord, now)).toBeNull();
  });
});

describe('buildMarketDetail — identity, next action, due date, blocker', () => {
  it('renders identity and zero-pads the market number', () => {
    const view = buildMarketDetail(market({ marketNumber: 1 }), now);
    expect(view?.marketNumberDisplay).toBe('001');
    expect(view?.schoolName).toBe('Pillager High School');
    expect(view?.stateLabel).toBe('DEVELOPMENT');
    expect(view?.owner).toBe('Keith');
    expect(view?.priority).toBe('TIER_1');
  });

  it('renders the next action and its due date', () => {
    const view = buildMarketDetail(
      market({ marketNumber: 1, nextAction: 'Ship first drop', nextActionDue: '2026-10-09T12:00:00.000Z' }),
      now,
    );
    expect(view?.nextAction).toBe('Ship first drop');
    expect(view?.hasNextAction).toBe(true);
    expect(view?.hasDueDate).toBe(true);
    expect(view?.nextActionDueLabel).toBe('In 4d');
    expect(view?.nextActionDueAbsolute).not.toBe('');
  });

  it('shows the blocker when set (and reports none when absent)', () => {
    const blocked = buildMarketDetail(market({ marketNumber: 1, blocker: 'Awaiting rights clearance' }), now);
    expect(blocked?.hasBlocker).toBe(true);
    expect(blocked?.blocker).toBe('Awaiting rights clearance');

    const clear = buildMarketDetail(market({ marketNumber: 1, blocker: null }), now);
    expect(clear?.hasBlocker).toBe(false);
    expect(clear?.blocker).toBeNull();
  });

  it('carries the universe relationship it was activated from', () => {
    const view = buildMarketDetail(market({ marketNumber: 1, universeOrganizationId: 42 }), now);
    expect(view?.universeOrganizationId).toBe(42);
    expect(view?.universeReference).toMatch(/Universe #42/);
    expect(view?.universeReference).toMatch(/Pillager High School/);
  });
});

describe('honest empty states — never a fabricated number', () => {
  it('renders words (not 0) when revenue engines report nothing', () => {
    const view = buildMarketDetail(market({ marketNumber: 1, revenueEngineStatus: null }), now);
    expect(view?.hasRevenueData).toBe(false);
    expect(view?.revenue.map((r) => r.value)).toEqual([
      MARKET_DETAIL_COPY.revenueNotReported,
      MARKET_DETAIL_COPY.revenueNotReported,
      MARKET_DETAIL_COPY.revenueNotReported,
    ]);
    expect(view?.revenue.every((r) => r.isReported === false)).toBe(true);
    // No row ever renders a bare numeric zero.
    for (const row of view?.revenue ?? []) {
      expect(row.value).not.toMatch(/^0$/);
    }
  });

  it('renders the reported engine values when present', () => {
    const view = buildMarketDetail(
      market({
        marketNumber: 1,
        revenueEngineStatus: { teamUniforms: 'ACTIVE', lettered: 'LIVE', issue: null, note: null },
      }),
      now,
    );
    expect(view?.hasRevenueData).toBe(true);
    expect(view?.revenue[0]).toMatchObject({ label: 'TEAM UNIFORMS', value: 'ACTIVE', isReported: true });
    expect(view?.revenue[1]).toMatchObject({ label: 'LETTERED', value: 'LIVE', isReported: true });
    expect(view?.revenue[2]).toMatchObject({ label: 'ISSUE', value: MARKET_DETAIL_COPY.revenueNotReported, isReported: false });
  });

  it('renders honest copy when the next action / objective are absent', () => {
    const view = buildMarketDetail(market({ marketNumber: 1, nextAction: '', objective: '' }), now);
    expect(view?.nextAction).toBe(MARKET_DETAIL_COPY.noNextAction);
    expect(view?.hasNextAction).toBe(false);
    expect(view?.objective).toBe(MARKET_DETAIL_COPY.noObjective);
  });
});

describe('buildLetteredPanel — consumes the new endpoint honestly', () => {
  it('renders the loading state', () => {
    expect(buildLetteredPanel(null, true, now).kind).toBe('loading');
  });

  it('renders an honest "not yet available" state when the endpoint is missing/failed', () => {
    const failed: LetteredLookup = { ok: false, error: 'API request failed: 404' };
    const panel = buildLetteredPanel(failed, false, now);
    expect(panel.kind).toBe('unavailable');
    if (panel.kind === 'unavailable') {
      expect(panel.title).toBe(MARKET_DETAIL_COPY.letteredUnavailable);
      expect(panel.detail).toMatch(/not answering yet/i);
    }
    // A null lookup while not loading is treated as unavailable too (no throw).
    expect(buildLetteredPanel(null, false, now).kind).toBe('unavailable');
  });

  it('renders an honest "none yet" state when the endpoint answers with no deployment', () => {
    const panel = buildLetteredPanel({ ok: true, deployment: null }, false, now);
    expect(panel.kind).toBe('none');
    if (panel.kind === 'none') expect(panel.title).toBe(MARKET_DETAIL_COPY.letteredNone);
  });

  it('renders the deployment state, next action and due date when available', () => {
    const lookup: LetteredLookup = {
      ok: true,
      deployment: {
        id: 3,
        marketId: 1,
        marketNumber: 1,
        state: 'LIVE',
        objective: 'Launch the fall drop',
        ownerId: 7,
        priority: 'TIER_1',
        nextAction: 'Publish the storefront',
        nextActionDue: '2026-10-09T12:00:00.000Z',
        blocker: null,
        dropsOrganizationId: 'org-1',
        dropsCollectionId: 'col-1',
        storefrontUrl: '/schools/pillager/fall',
        dropsDropId: null,
        createdAt: null,
        updatedAt: null,
      },
    };
    const panel = buildLetteredPanel(lookup, false, now);
    expect(panel.kind).toBe('available');
    if (panel.kind === 'available') {
      expect(panel.state).toBe('LIVE');
      expect(panel.stateLabel).toBe('LIVE');
      expect(panel.isKnownState).toBe(true);
      expect(panel.nextAction).toBe('Publish the storefront');
      expect(panel.nextActionDueLabel).toBe('In 4d');
      // Lifecycle comes from the canonical shared states, not a local list.
      expect(panel.lifecycle).toContain('IDENTIFIED');
      expect(panel.lifecycle).toContain('DROP_002');
    }
  });

  it('flags an unrecognised state rather than pretending it is canonical', () => {
    const lookup = {
      ok: true as const,
      deployment: {
        id: 3,
        marketId: 1,
        marketNumber: 1,
        state: 'NOT_A_REAL_STATE',
        objective: '',
        ownerId: null,
        priority: null,
        nextAction: '',
        nextActionDue: '',
        blocker: null,
        dropsOrganizationId: null,
        dropsCollectionId: null,
        storefrontUrl: null,
        dropsDropId: null,
        createdAt: null,
        updatedAt: null,
      },
    };
    const panel = buildLetteredPanel(lookup, false, now);
    expect(panel.kind).toBe('available');
    if (panel.kind === 'available') {
      expect(panel.isKnownState).toBe(false);
      expect(panel.stateLabel).toBe(MARKET_DETAIL_COPY.unknownLifecycleState);
    }
  });

  it('recognises only canonical LETTERED states', () => {
    expect(isKnownLetteredState('LIVE')).toBe(true);
    expect(isKnownLetteredState('INSTITUTIONAL_FIRST_LOOK')).toBe(true);
    expect(isKnownLetteredState('NOT_A_REAL_STATE')).toBe(false);
  });
});

describe('buildDropsPanel — honest not-yet-wired state', () => {
  it('renders a NOT_WIRED status with no numbers', () => {
    const panel = buildDropsPanel();
    expect(panel.status).toBe('NOT_WIRED');
    expect(panel.message).toMatch(/not yet wired/i);
    expect(panel.detail).toMatch(/never a fabricated number|no commerce figure/i);
  });
});
