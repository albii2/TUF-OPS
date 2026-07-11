import { useEffect, useState } from 'react';
import { getOpsWorkspaceQueues, getOrderById, getOrderByOpportunityId, listOrders, type OrderListParams } from '../services/ordersService';
import type { Order } from '../data/mockSalesData';

export function useOrders(params: OrderListParams): Order[] {
  const [data, setData] = useState<Order[]>([]);

  useEffect(() => {
    let cancelled = false;
    listOrders(params).then((orders) => {
      if (!cancelled) setData(orders);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [params.search, params.productionStatus, params.refreshKey]);

  return data;
}

export function useOrderById(id?: string): Order | undefined {
  const [data, setData] = useState<Order | undefined>(undefined);

  useEffect(() => {
    if (!id) { setData(undefined); return; }
    let cancelled = false;
    getOrderById(id).then((order) => {
      if (!cancelled) setData(order);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [id]);

  return data;
}

export function useOpsWorkspaceQueues() {
  const [data, setData] = useState<ReturnType<typeof getOpsWorkspaceQueues> extends Promise<infer T> ? T : never>({
    NEEDS_REVIEW: [],
    READY_FOR_VENDOR: [],
    IN_PRODUCTION: [],
    BLOCKED: [],
    COMPLETED: [],
  });

  useEffect(() => {
    let cancelled = false;
    getOpWorkspaceQueues().then((queues) => {
      if (!cancelled) setData(queues);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return data;
}

export function useOrderByOpportunityId(opportunityId?: string, refreshKey?: number): Order | undefined {
  const [data, setData] = useState<Order | undefined>(undefined);

  useEffect(() => {
    if (!opportunityId) { setData(undefined); return; }
    let cancelled = false;
    getOrderByOpportunityId(opportunityId).then((order) => {
      if (!cancelled) setData(order);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [opportunityId, refreshKey]);

  return data;
}
