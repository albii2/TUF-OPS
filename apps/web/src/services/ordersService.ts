import { opsWorkspaceQueue, orders, type Order } from '../data/mockSalesData';
import { DATA_MODE } from './dataMode';
import { getStoredUser } from '../auth';
import { opportunities } from '../data/mockSalesData';

export type OrderListParams = {
  search?: string;
  productionStatus?: 'ALL' | Order['productionStatus'];
};

export function listOrders(params: OrderListParams = {}): Order[] {
  if (DATA_MODE !== 'mock') return [];

  const user = getStoredUser();
  return orders.filter((order) => {
    const matchesSearch = (params.search ?? '').trim()
      ? [order.id, order.organizationName, order.vendor].join(' ').toLowerCase().includes((params.search ?? '').toLowerCase())
      : true;
    const matchesStatus = !params.productionStatus || params.productionStatus === 'ALL' || order.productionStatus === params.productionStatus;
    const repForOrder = opportunities.find((o) => o.id === order.opportunityId)?.assignedRep;
    const roleScoped = !user ? true : ['OWNER', 'DIRECTOR', 'OPS'].includes(user.role) ? true : repForOrder === user.name;
    return matchesSearch && matchesStatus && roleScoped;
  });
}

export function getOrderById(id: string): Order | undefined {
  if (DATA_MODE !== 'mock') return undefined;
  return listOrders({}).find((order) => order.id === id);
}

export function getOpsWorkspaceQueues() {
  if (DATA_MODE !== 'mock') {
    return { NEEDS_REVIEW: [], READY_FOR_VENDOR: [], IN_PRODUCTION: [], BLOCKED: [], COMPLETED: [] } as typeof opsWorkspaceQueue;
  }
  return opsWorkspaceQueue;
}
