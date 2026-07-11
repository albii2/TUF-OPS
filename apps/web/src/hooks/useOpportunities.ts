import { useQuery } from '@tanstack/react-query';
import {
  getOpportunities,
  getOpportunity,
  getOpportunityStages,
  getRevenueLanes,
  queryKeys,
} from '../api';
import type { OpportunityListParams } from '../services/opportunitiesService';
import type { Opportunity } from '../data/mockSalesData';

export function useOpportunities(params: OpportunityListParams) {
  return useQuery<Opportunity[]>({
    queryKey: queryKeys.opportunities.list(params),
    queryFn: () => getOpportunities(params),
  });
}

export function useOpportunityById(id?: string) {
  return useQuery<Opportunity | undefined>({
    queryKey: queryKeys.opportunities.detail(id ?? ''),
    queryFn: () => getOpportunity(id!),
    enabled: Boolean(id),
  });
}

export function useOpportunityStages() {
  return useQuery({
    queryKey: queryKeys.opportunities.stages(),
    queryFn: getOpportunityStages,
    staleTime: Infinity,
  });
}

export function useRevenueLanes() {
  return useQuery({
    queryKey: queryKeys.opportunities.revenueLanes(),
    queryFn: getRevenueLanes,
    staleTime: Infinity,
  });
}
