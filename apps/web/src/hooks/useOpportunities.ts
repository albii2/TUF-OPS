import { useEffect, useMemo, useState } from 'react';
import { getOpportunityById, getOpportunityStages, getRevenueLanes, listOpportunities, type OpportunityListParams } from '../services/opportunitiesService';
import type { Opportunity } from '../data/mockSalesData';

export function useOpportunities(params: OpportunityListParams): Opportunity[] {
  const [apiData, setApiData] = useState<Opportunity[]>([]);
  const [eventRefreshKey, setEventRefreshKey] = useState(0);

  useEffect(() => {
    const refresh = () => setEventRefreshKey((key) => key + 1);
    window.addEventListener('tuf:opportunity-updated', refresh);
    return () => window.removeEventListener('tuf:opportunity-updated', refresh);
  }, []);

  useEffect(() => {
    let cancelled = false;
    listOpportunities(params).then((data) => {
      if (!cancelled) setApiData(data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [params.search, params.stage, params.lane, params.rep, params.sport, params.refreshKey, eventRefreshKey]);

  return apiData;
}

export function useOpportunityById(id?: string): Opportunity | undefined {
  const [apiData, setApiData] = useState<Opportunity | undefined>(undefined);
  const [eventRefreshKey, setEventRefreshKey] = useState(0);

  useEffect(() => {
    const refresh = () => setEventRefreshKey((key) => key + 1);
    window.addEventListener('tuf:opportunity-updated', refresh);
    return () => window.removeEventListener('tuf:opportunity-updated', refresh);
  }, []);

  useEffect(() => {
    if (!id) { setApiData(undefined); return; }
    let cancelled = false;
    listOpportunities({}).then((data) => {
      if (!cancelled) setApiData(data.find((o) => o.id === id));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [id, eventRefreshKey]);

  return apiData;
}

export function useOpportunityStages() {
  return useMemo(() => getOpportunityStages(), []);
}

export function useRevenueLanes() {
  return useMemo(() => getRevenueLanes(), []);
}
