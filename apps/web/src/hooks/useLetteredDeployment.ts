import { useCallback, useEffect, useState } from 'react';
import {
  getLetteredDeploymentForMarket,
  type LetteredLookup,
} from '../services/letteredService';

export type LetteredQuery = {
  /** `null` while the first fetch is in flight. */
  lookup: LetteredLookup | null;
  loading: boolean;
  reload: () => void;
};

/**
 * Reads the LETTERED deployment for a Market from
 * `GET /api/v1/markets/:idOrNumber/lettered`.
 *
 * The hook NEVER fabricates and never throws: a missing or failing endpoint
 * resolves to `{ ok: false }`, which the panel renders as an honest
 * "not yet available" state.
 */
export function useLetteredDeployment(marketNumber: number | string | undefined): LetteredQuery {
  const [lookup, setLookup] = useState<LetteredLookup | null>(null);
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
    getLetteredDeploymentForMarket(marketNumber)
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
