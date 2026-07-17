import { useQuery } from '@tanstack/react-query';
import { getOrders, getOrder, getOrderByOpportunityId, getOpsWorkspaceQueues, queryKeys, } from '../api';
export function useOrders(params) {
    return useQuery({
        queryKey: queryKeys.orders.list(params),
        queryFn: () => getOrders(params),
    });
}
export function useOrderById(id) {
    return useQuery({
        queryKey: queryKeys.orders.detail(id ?? ''),
        queryFn: () => getOrder(id),
        enabled: Boolean(id),
    });
}
export function useOpsWorkspaceQueues() {
    return useQuery({
        queryKey: queryKeys.orders.opsWorkspace(),
        queryFn: getOpsWorkspaceQueues,
    });
}
export function useOrderByOpportunityId(opportunityId) {
    return useQuery({
        queryKey: queryKeys.orders.byOpportunityId(opportunityId ?? ''),
        queryFn: () => getOrderByOpportunityId(opportunityId),
        enabled: Boolean(opportunityId),
    });
}
//# sourceMappingURL=useOrders.js.map