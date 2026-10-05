/**
 * MarketMetric service — normalisation + the honest failure path (Wave 4B).
 *
 * Proves the Wave 4B contract: a missing or failing metrics endpoint resolves
 * to `{ ok: false }` (the "not yet available" state) and NEVER throws; an
 * absent metric stays `null` (never a fake 0); staleness is only reported when
 * the backend marks it; and a universe-only record (no marketNumber) is never
 * fetched as a market.
 */
jest.mock('../services/apiClient', () => ({ apiClient: jest.fn() }));

import { apiClient } from '../services/apiClient';
import {
  formatAttributionSummary,
  getMarketMetricsForMarket,
  isMarketNumber,
  metricFromPayload,
  normalizeMarketMetric,
} from '../services/metricsService';

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

beforeEach(() => {
  mockApiClient.mockReset();
});

describe('normalizeMarketMetric', () => {
  it('accepts a snake_case snapshot and maps the approved fields', () => {
    const record = normalizeMarketMetric({
      store_status: 'PUBLISHED',
      lifecycle_status: 'LIVE',
      order_count: 12,
      revenue: 480.25,
      units_ordered: 30,
      utm_summary: { source: 'facebook', medium: 'social', attributed_order_count: 5 },
      fetched_at: '2026-10-05T10:00:00.000Z',
      stale: true,
    });
    expect(record).not.toBeNull();
    expect(record?.storeStatus).toBe('PUBLISHED');
    expect(record?.lifecycleStatus).toBe('LIVE');
    expect(record?.orderCount).toBe(12);
    expect(record?.orderValue).toBe(480.25);
    expect(record?.units).toBe(30);
    expect(record?.attributionSummary).toMatch(/facebook/);
    expect(record?.fetchedAt).toBe('2026-10-05T10:00:00.000Z');
    expect(record?.stale).toBe(true);
  });

  it('accepts a camelCase snapshot, including a nested production summary for units', () => {
    const record = normalizeMarketMetric({
      storeStatus: 'DRAFT',
      orderCount: 0,
      revenue: 0,
      productionSummary: { unitsOrdered: 0 },
      lastSyncAt: '2026-10-05T09:00:00.000Z',
    });
    // A genuinely reported 0 survives as 0 — it is the truth, not a placeholder.
    expect(record?.orderCount).toBe(0);
    expect(record?.orderValue).toBe(0);
    expect(record?.units).toBe(0);
    expect(record?.attributionSummary).toBeNull();
    expect(record?.stale).toBe(false);
  });

  it('NEVER coerces an absent metric to 0 — absent stays null', () => {
    const record = normalizeMarketMetric({ fetched_at: '2026-10-05T09:00:00.000Z' });
    expect(record).not.toBeNull();
    expect(record?.storeStatus).toBeNull();
    expect(record?.orderCount).toBeNull();
    expect(record?.orderValue).toBeNull();
    expect(record?.units).toBeNull();
    expect(record?.attributionSummary).toBeNull();
  });

  it('rejects blank / negative / non-numeric values as absent, not zero', () => {
    const record = normalizeMarketMetric({
      fetched_at: '2026-10-05T09:00:00.000Z',
      order_count: -3,
      revenue: '',
      units: 'abc',
    });
    expect(record?.orderCount).toBeNull();
    expect(record?.orderValue).toBeNull();
    expect(record?.units).toBeNull();
  });

  it('requires a fetched_at — a snapshot with no sync time is not renderable', () => {
    expect(normalizeMarketMetric({ order_count: 5 })).toBeNull();
    expect(normalizeMarketMetric({})).toBeNull();
    expect(normalizeMarketMetric(null)).toBeNull();
    expect(normalizeMarketMetric('nope')).toBeNull();
    expect(normalizeMarketMetric([])).toBeNull();
  });

  it('reports staleness ONLY when the backend marks it', () => {
    const key = { fetched_at: '2026-10-05T09:00:00.000Z' };
    expect(normalizeMarketMetric({ ...key, is_stale: 'true' })?.stale).toBe(true);
    expect(normalizeMarketMetric({ ...key, staleStatus: 'STALE' })?.stale).toBe(true);
    expect(normalizeMarketMetric({ ...key, stale: false })?.stale).toBe(false);
    // No marker at all ⇒ we do not invent staleness.
    expect(normalizeMarketMetric({ ...key })?.stale).toBe(false);
  });
});

describe('formatAttributionSummary', () => {
  it('renders a bare string as-is', () => {
    expect(formatAttributionSummary('referral')).toBe('referral');
  });

  it('renders a source/medium/campaign object as a compact line', () => {
    expect(formatAttributionSummary({ source: 'fb', medium: 'social' })).toBe('fb · social');
  });

  it('renders bounded top-referrer aggregates', () => {
    expect(formatAttributionSummary({ topReferrers: [{ referrer: 'newsletter', count: 3 }] })).toMatch(
      /newsletter \(3\)/,
    );
  });

  it('returns null for empty or meaningless payloads', () => {
    expect(formatAttributionSummary({})).toBeNull();
    expect(formatAttributionSummary(null)).toBeNull();
    expect(formatAttributionSummary(42)).toBeNull();
  });
});

describe('metricFromPayload', () => {
  it('unwraps an envelope (metric / market_metric / snapshot)', () => {
    expect(metricFromPayload({ metric: { fetched_at: '2026-10-05T10:00:00.000Z', order_count: 3 } })?.orderCount).toBe(3);
    expect(metricFromPayload({ market_metric: { fetched_at: '2026-10-05T10:00:00.000Z', order_count: 4 } })?.orderCount).toBe(4);
    expect(metricFromPayload({ snapshot: { fetched_at: '2026-10-05T10:00:00.000Z' } })?.fetchedAt).toBe(
      '2026-10-05T10:00:00.000Z',
    );
  });

  it('accepts a bare object', () => {
    expect(metricFromPayload({ fetched_at: '2026-10-05T10:00:00.000Z', revenue: 9 })?.orderValue).toBe(9);
  });

  it('returns null for an explicit null envelope or an empty payload', () => {
    expect(metricFromPayload({ metric: null })).toBeNull();
    expect(metricFromPayload({})).toBeNull();
    expect(metricFromPayload(null)).toBeNull();
  });
});

describe('getMarketMetricsForMarket — defensive against a not-yet-built endpoint', () => {
  it('returns the metric when the endpoint answers', async () => {
    mockApiClient.mockResolvedValueOnce({
      metric: { fetched_at: '2026-10-05T10:00:00.000Z', order_count: 4, revenue: 88 },
    });
    const result = await getMarketMetricsForMarket(1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.metric?.orderCount).toBe(4);
      expect(result.metric?.orderValue).toBe(88);
    }
  });

  it('returns ok:true with metric:null when no snapshot is cached yet', async () => {
    mockApiClient.mockResolvedValueOnce({ metric: null });
    const result = await getMarketMetricsForMarket(1);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.metric).toBeNull();
  });

  it('NEVER throws on a failing/missing endpoint — resolves to ok:false', async () => {
    mockApiClient.mockRejectedValueOnce(new Error('API request failed: 404'));
    const result = await getMarketMetricsForMarket(2);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/404/);
  });

  it('handles a non-Error rejection honestly', async () => {
    mockApiClient.mockRejectedValueOnce('boom');
    const result = await getMarketMetricsForMarket(3);
    expect(result.ok).toBe(false);
  });

  it('does not fetch for a universe-only record (no marketNumber)', async () => {
    const zero = await getMarketMetricsForMarket(0);
    const blank = await getMarketMetricsForMarket('');
    const junk = await getMarketMetricsForMarket('abc');
    expect(zero.ok).toBe(false);
    expect(blank.ok).toBe(false);
    expect(junk.ok).toBe(false);
    expect(mockApiClient).not.toHaveBeenCalled();
  });
});

describe('isMarketNumber', () => {
  it('accepts only positive integers (number or numeric string)', () => {
    expect(isMarketNumber(1)).toBe(true);
    expect(isMarketNumber('001')).toBe(true);
    expect(isMarketNumber(0)).toBe(false);
    expect(isMarketNumber(-1)).toBe(false);
    expect(isMarketNumber(1.5)).toBe(false);
    expect(isMarketNumber('')).toBe(false);
    expect(isMarketNumber(undefined)).toBe(false);
    expect(isMarketNumber(null)).toBe(false);
  });
});
