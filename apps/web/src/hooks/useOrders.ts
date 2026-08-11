import { useQuery } from '@tanstack/react-query';
import {
  getOrders,
  getOrder,
  getOrderByOpportunityId,
  getOpsWorkspaceQueues,
  queryKeys,
} from '../api';
import type { OrderListParams } from '../services/ordersService';
import type { Order } from '../data/mockSalesData';

export function useOrders(params: OrderListParams) {
  return useQuery<Order[]>({
    queryKey: queryKeys.orders.list(params),
    queryFn: () => getOrders(params),
  });
}

export function useOrderById(id?: string) {
  return useQuery<Order | undefined>({
    queryKey: queryKeys.orders.detail(id ?? ''),
    queryFn: () => getOrder(id!),
    enabled: Boolean(id),
  });
}

export function useOpsWorkspaceQueues() {
  return useQuery({
    queryKey: queryKeys.orders.opsWorkspace(),
    queryFn: getOpsWorkspaceQueues,
  });
}

export function useOrderByOpportunityId(opportunityId?: string) {
  return useQuery<Order | undefined>({
    queryKey: queryKeys.orders.byOpportunityId(opportunityId ?? ''),
    queryFn: () => getOrderByOpportunityId(opportunityId),
    enabled: Boolean(opportunityId),
  });
}
