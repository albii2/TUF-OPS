import { useEffect, useMemo, useState } from 'react';
import { getOpportunityById, getOpportunityStages, getRevenueLanes, listOpportunities, listOpportunitiesAsync, type OpportunityListParams } from '../services/opportunitiesService';
import { DATA_MODE } from '../services/dataMode';

export function useOpportunities(params: OpportunityListParams) {
  const [apiOpps, setApiOpps] = useState<any[]>([]);
  const [eventRefreshKey, setEventRefreshKey] = useState(0);

  useEffect(() => {
    const refresh = () => setEventRefreshKey((key) => key + 1);
    window.addEventListener('tuf:opportunity-updated', refresh);
    return () => window.removeEventListener('tuf:opportunity-updated', refresh);
  }, []);

  const refreshKey = params.refreshKey ?? 0;

  useEffect(() => {
    if (DATA_MODE === 'api') {
      let cancelled = false;
      listOpportunitiesAsync(params).then((opps) => {
        if (!cancelled) setApiOpps(opps);
      });
      return () => { cancelled = true; };
    }
  }, [params.search, params.stage, params.lane, params.rep, params.sport, refreshKey, eventRefreshKey]);

  const mockOpps = useMemo(() => listOpportunities(params), [params.search, params.stage, params.lane, params.rep, params.sport, refreshKey, eventRefreshKey]);

  return DATA_MODE === 'api' ? apiOpps : mockOpps;
}

export function useOpportunityById(id?: string) {
  const [eventRefreshKey, setEventRefreshKey] = useState(0);

  useEffect(() => {
    const refresh = () => setEventRefreshKey((key) => key + 1);
    window.addEventListener('tuf:opportunity-updated', refresh);
    return () => window.removeEventListener('tuf:opportunity-updated', refresh);
  }, []);

  return useMemo(() => (id ? getOpportunityById(id) : undefined), [id, eventRefreshKey]);
}

export function useOpportunityStages() {
  return useMemo(() => getOpportunityStages(), []);
}

export function useRevenueLanes() {
  return useMemo(() => getRevenueLanes(), []);
}
