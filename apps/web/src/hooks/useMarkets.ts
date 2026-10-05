import { useCallback, useEffect, useState } from 'react';
import { listMarkets, type MarketRecord } from '../services/marketsService';

export type MarketsQuery = {
  markets: MarketRecord[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

/**
 * Reads the activated Markets from the Markets API.
 *
 * The hook surfaces an honest error string rather than fabricating a number:
 * when the API is unavailable, callers render the error, never a fake zero.
 */
export function useMarkets(): MarketsQuery {
  const [markets, setMarkets] = useState<MarketRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    listMarkets()
      .then((rows) => {
        if (cancelled) return;
        setMarkets(rows);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setMarkets([]);
        setError(err instanceof Error ? err.message : 'Unable to load markets');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return { markets, loading, error, reload };
}
