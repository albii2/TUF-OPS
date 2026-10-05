import { useCallback, useEffect, useState } from 'react';
import { getMarketMetricsForMarket, type MetricsLookup } from '../services/metricsService';

export type MarketMetricsQuery = {
  /** `null` while the first fetch is in flight. */
  lookup: MetricsLookup | null;
  loading: boolean;
  reload: () => void;
};

/**
 * Reads the cached Drops commerce snapshot (MarketMetric) for a Market from
 * `GET /api/v1/markets/:idOrNumber/metrics`.
 *
 * The hook NEVER fabricates and never throws: a missing or failing endpoint
 * resolves to `{ ok: false }`, which the panel renders as an honest
 * "not yet available" state. An absent marketNumber (a universe organization
 * record is not a market) resolves to `{ ok: false }` without fetching.
 */
export function useMarketMetrics(marketNumber: number | string | undefined): MarketMetricsQuery {
  const [lookup, setLookup] = useState<MetricsLookup | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    if (marketNumber === undefined || marketNumber === null || marketNumber === '') {
      setLookup({ ok: false, error: 'No market number' });
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    getMarketMetricsForMarket(marketNumber)
      .then((result) => {
        if (!cancelled) setLookup(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [marketNumber, nonce]);

  return { lookup, loading, reload };
}
