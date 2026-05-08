import { useMemo } from 'react';
import { getOpportunityById, getOpportunityStages, getRevenueLanes, listOpportunities, type OpportunityListParams } from '../services/opportunitiesService';

export function useOpportunities(params: OpportunityListParams) {
  return useMemo(() => listOpportunities(params), [params.search, params.stage, params.lane, params.rep, params.sport, params.refreshKey]);
}

export function useOpportunityById(id?: string) {
  return useMemo(() => (id ? getOpportunityById(id) : undefined), [id]);
}

export function useOpportunityStages() {
  return useMemo(() => getOpportunityStages(), []);
}

export function useRevenueLanes() {
  return useMemo(() => getRevenueLanes(), []);
}
