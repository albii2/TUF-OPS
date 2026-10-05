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
import type { MarketMetricRecord, MetricsLookup } from '../services/metricsService';
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

describe('buildDropsPanel — the read-only commerce panel (Wave 4B)', () => {
  const metric = (partial: Partial<MarketMetricRecord> = {}): MarketMetricRecord => ({
    storeStatus: null,
    lifecycleStatus: null,
    orderCount: null,
    orderValue: null,
    units: null,
    attributionSummary: null,
    storeUrl: null,
    publishedAt: null,
    fetchedAt: '2026-10-05T11:30:00.000Z',
    stale: false,
    ...partial,
  });

  const available = (partial: Partial<MarketMetricRecord> = {}) => {
    const panel = buildDropsPanel({ ok: true, metric: metric(partial) }, false);
    expect(panel.kind).toBe('available');
    if (panel.kind !== 'available') throw new Error('expected available');
    return panel;
  };

  it('(a) renders the real summary fields and an "as of" time from a populated snapshot', () => {
    const panel = available({
      storeStatus: 'PUBLISHED',
      lifecycleStatus: 'LIVE',
      orderCount: 42,
      orderValue: 3150.5,
      units: 130,
      attributionSummary: 'facebook · social · 18 attributed',
    });

    const byKey = Object.fromEntries(panel.rows.map((row) => [row.key, row]));
    expect(byKey.storefront.value).toBe('PUBLISHED · LIVE');
    expect(byKey.orders.value).toBe('42');
    expect(byKey.orderValue.value).toBe('3150.5');
    expect(byKey.units.value).toBe('130');
    expect(byKey.attribution.value).toMatch(/facebook/);

    // Only the approved summary fields are rendered.
    expect(panel.rows.map((row) => row.key)).toEqual([
      'storefront',
      'orders',
      'orderValue',
      'units',
      'attribution',
    ]);
    expect(panel.hasAnyValue).toBe(true);
    expect(panel.stale).toBe(false);
    expect(panel.hasFetchedAt).toBe(true);
    expect(panel.asOfLabel).toMatch(/^As of /);
    expect(panel.fetchedAtAbsolute).not.toBe('');
    // A populated snapshot carries the timestamp through untouched.
    expect(panel.metric.fetchedAt).toBe('2026-10-05T11:30:00.000Z');
  });

  it('(b) visibly marks a STALE snapshot as stale', () => {
    const panel = available({ orderCount: 5, orderValue: 100, stale: true });
    expect(panel.stale).toBe(true);
    expect(panel.statusLabel).toBe(MARKET_DETAIL_COPY.dropsStale);
    expect(panel.statusTone).toBe('stale');
  });

  it('(c) renders the honest "not yet available" state on a missing/failing endpoint — no throw, no numbers', () => {
    const failed: MetricsLookup = { ok: false, error: 'API request failed: 404' };
    const panel = buildDropsPanel(failed, false);
    expect(panel.kind).toBe('unavailable');
    if (panel.kind === 'unavailable') {
      expect(panel.title).toBe(MARKET_DETAIL_COPY.dropsUnavailable);
      expect(panel.detail).toMatch(/not answering yet/i);
      // There is no rows collection and therefore no number to leak.
      expect('rows' in panel).toBe(false);
    }
    // A null lookup while not loading is treated as unavailable too (no throw).
    expect(buildDropsPanel(null, false).kind).toBe('unavailable');
    // Loading short-circuits before anything else.
    expect(buildDropsPanel(null, true).kind).toBe('loading');
  });

  it('(d) renders "no data" (never 0) when a metric is absent', () => {
    const panel = available();
    expect(panel.hasAnyValue).toBe(false);
    for (const row of panel.rows) {
      expect(row.hasValue).toBe(false);
      expect(row.value).toBe(MARKET_DETAIL_COPY.dropsNoData);
      expect(row.value).not.toMatch(/^0$/);
    }
  });

  it('does not conflate a reported 0 with absent data — a real 0 stays 0', () => {
    const panel = available({ orderCount: 0, orderValue: 0, units: 0 });
    const byKey = Object.fromEntries(panel.rows.map((row) => [row.key, row]));
    expect(byKey.orders).toMatchObject({ value: '0', hasValue: true });
    expect(byKey.orderValue).toMatchObject({ value: '0', hasValue: true });
    expect(byKey.units).toMatchObject({ value: '0', hasValue: true });
    // The unattributed field is still the honest empty state, not a zero.
    expect(byKey.attribution).toMatchObject({ value: MARKET_DETAIL_COPY.dropsNoData, hasValue: false });
    expect(panel.hasAnyValue).toBe(true);
  });

  it('renders the honest "no snapshot yet" state when the endpoint answers with no metric', () => {
    const panel = buildDropsPanel({ ok: true, metric: null }, false);
    expect(panel.kind).toBe('none');
    if (panel.kind === 'none') {
      expect(panel.title).toBe(MARKET_DETAIL_COPY.dropsNone);
      expect('rows' in panel).toBe(false);
    }
  });

  it('(e) a universe-only record is never a market, so no Drops panel data source exists', () => {
    const universeOnly = { id: 501, name: 'Universe Only Academy', state: 'MN' } as unknown as MarketRecord;
    expect(isMarketRecord(universeOnly)).toBe(false);
    // No market detail ⇒ the page never reaches the Drops panel for this record.
    expect(buildMarketDetail(universeOnly, now)).toBeNull();
  });
});
