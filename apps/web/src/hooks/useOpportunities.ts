import { useEffect, useMemo, useState } from 'react';
import { getOpportunityById, getOpportunityStages, getRevenueLanes, listOpportunities, type OpportunityListParams } from '../services/opportunitiesService';

export function useOpportunities(params: OpportunityListParams) {
  const [eventRefreshKey, setEventRefreshKey] = useState(0);

  useEffect(() => {
    const refresh = () => setEventRefreshKey((key) => key + 1);
    window.addEventListener('tuf:opportunity-updated', refresh);
    return () => window.removeEventListener('tuf:opportunity-updated', refresh);
  }, []);

  return useMemo(() => listOpportunities(params), [params.search, params.stage, params.lane, params.rep, params.sport, params.refreshKey, eventRefreshKey]);
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
