import { useMemo } from 'react';
import { getOpsWorkspaceQueues, getOrderById, getOrderByOpportunityId, listOrders, type OrderListParams } from '../services/ordersService';

export function useOrders(params: OrderListParams) {
  return useMemo(() => listOrders(params), [params.search, params.productionStatus, params.refreshKey]);
}

export function useOrderById(id?: string) {
  return useMemo(() => (id ? getOrderById(id) : undefined), [id]);
}

export function useOpsWorkspaceQueues() {
  return useMemo(() => getOpsWorkspaceQueues(), []);
}

export function useOrderByOpportunityId(opportunityId?: string, refreshKey?: number) {
  return useMemo(() => getOrderByOpportunityId(opportunityId), [opportunityId, refreshKey]);
}
