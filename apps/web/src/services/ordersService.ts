import { opsWorkspaceQueue, orders, type Order } from '../data/mockSalesData';
import { DATA_MODE } from './dataMode';

export type OrderListParams = {
  search?: string;
  productionStatus?: 'ALL' | Order['productionStatus'];
};

export function listOrders(params: OrderListParams = {}): Order[] {
  if (DATA_MODE !== 'mock') return [];

  return orders.filter((order) => {
    const matchesSearch = (params.search ?? '').trim()
      ? [order.id, order.organizationName, order.vendor].join(' ').toLowerCase().includes((params.search ?? '').toLowerCase())
      : true;
    const matchesStatus = !params.productionStatus || params.productionStatus === 'ALL' || order.productionStatus === params.productionStatus;
    return matchesSearch && matchesStatus;
  });
}

export function getOrderById(id: string): Order | undefined {
  if (DATA_MODE !== 'mock') return undefined;
  return orders.find((order) => order.id === id);
}

export function getOpsWorkspaceQueues() {
  if (DATA_MODE !== 'mock') {
    return { NEEDS_REVIEW: [], READY_FOR_VENDOR: [], IN_PRODUCTION: [], BLOCKED: [], COMPLETED: [] } as typeof opsWorkspaceQueue;
  }
  return opsWorkspaceQueue;
}
