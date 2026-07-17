import { useQuery } from '@tanstack/react-query';
import { getOpportunities, getOpportunity, getOpportunityStages, getRevenueLanes, queryKeys, } from '../api';
export function useOpportunities(params) {
    return useQuery({
        queryKey: queryKeys.opportunities.list(params),
        queryFn: () => getOpportunities(params),
    });
}
export function useOpportunityById(id) {
    return useQuery({
        queryKey: queryKeys.opportunities.detail(id ?? ''),
        queryFn: () => getOpportunity(id),
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
//# sourceMappingURL=useOpportunities.js.map