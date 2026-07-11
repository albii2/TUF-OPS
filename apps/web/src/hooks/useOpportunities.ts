import { useEffect, useState } from 'react';
import { getOpportunityStages, getRevenueLanes, listOpportunities, type OpportunityListParams } from '../services/opportunitiesService';
import { listOpportunitiesAsync } from '../services/opportunitiesService';
import type { Opportunity, OpportunityStage } from '../data/mockSalesData';

export function useOpportunities(params: OpportunityListParams): Opportunity[] {
  const [data, setData] = useState<Opportunity[]>([]);

  useEffect(() => {
    let cancelled = false;
    listOpportunitiesAsync(params).then((res) => {
      if (!cancelled) setData(res);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [params.search, params.stage, params.lane, params.rep, params.sport, params.refreshKey]);

  return data;
}

export function useOpportunityById(id?: string): Opportunity | undefined {
  const [data, setData] = useState<Opportunity | undefined>(undefined);

  useEffect(() => {
    if (!id) { setData(undefined); return; }
    let cancelled = false;
    listOpportunitiesAsync({}).then((res) => {
      if (!cancelled) setData(res.find((o) => o.id === id));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [id]);

  return data;
}

export function useOpportunityStages(): OpportunityStage[] {
  return getOpportunityStages();
}

export function useRevenueLanes() {
  return getRevenueLanes();
}
