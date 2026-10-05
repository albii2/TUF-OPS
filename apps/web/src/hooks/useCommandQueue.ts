import { useCallback, useEffect, useState } from 'react';
import { getCommandQueue, type CommandLookup } from '../services/commandService';

export type CommandQueueQuery = {
  /** `null` while the first fetch is in flight. */
  lookup: CommandLookup | null;
  loading: boolean;
  reload: () => void;
};

/**
 * Reads COMMAND's obligation queue from `GET /api/v1/tasks/command`.
 *
 * The hook NEVER fabricates and never throws: a missing or failing endpoint
 * resolves to `{ ok: false }`, which the page renders as an honest
 * "not yet available" state. An endpoint that answers with nothing resolves to
 * `{ ok: true, obligations: [] }`, which the page renders as an honest empty
 * state — never a placeholder row and never a fake zero.
 */
export function useCommandQueue(): CommandQueueQuery {
  const [lookup, setLookup] = useState<CommandLookup | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    getCommandQueue()
      .then((result) => {
        if (!cancelled) setLookup(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return { lookup, loading, reload };
}
