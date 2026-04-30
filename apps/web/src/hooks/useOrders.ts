import { useMemo } from 'react';
import { getOpsWorkspaceQueues, getOrderById, listOrders, type OrderListParams } from '../services/ordersService';

export function useOrders(params: OrderListParams) {
  return useMemo(() => listOrders(params), [params.search, params.productionStatus]);
}

export function useOrderById(id?: string) {
  return useMemo(() => (id ? getOrderById(id) : undefined), [id]);
}

export function useOpsWorkspaceQueues() {
  return useMemo(() => getOpsWorkspaceQueues(), []);
}
