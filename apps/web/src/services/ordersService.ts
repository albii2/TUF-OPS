import { opportunities, orders as seededOrders, type Order } from '../data/mockSalesData';
import { DATA_MODE } from './dataMode';
import { getStoredUser } from '../auth';

export type OrderListParams = {
  search?: string;
  productionStatus?: 'ALL' | Order['productionStatus'];
};

export function listOrders(params: OrderListParams = {}): Order[] {
  if (DATA_MODE !== 'mock') return [];

  const user = getStoredUser();
  const orders: Order[] = seededOrders;
  return orders.filter((order) => {
    const matchesSearch = (params.search ?? '').trim()
      ? [order.id, order.organizationName, order.vendor].join(' ').toLowerCase().includes((params.search ?? '').toLowerCase())
      : true;
    const matchesStatus = !params.productionStatus || params.productionStatus === 'ALL' || order.productionStatus === params.productionStatus;
    const repForOrder = opportunities.find((opp) => opp.id === order.opportunityId)?.assignedRep;
    const roleScoped = !user ? true : ['OWNER', 'DIRECTOR', 'OPS'].includes(user.role) ? true : repForOrder === user.name;
    return matchesSearch && matchesStatus && roleScoped;
  });
}

export function getOrderById(id: string): Order | undefined {
  if (DATA_MODE !== 'mock') return undefined;
  return listOrders({}).find((order) => order.id === id);
}

export function getOpsWorkspaceQueues() {
  const allOrders = listOrders({});
  return {
    NEEDS_REVIEW: allOrders.filter((order) => order.productionStatus === 'NEEDS_REVIEW'),
    READY_FOR_VENDOR: allOrders.filter((order) => order.productionStatus === 'READY_FOR_VENDOR'),
    IN_PRODUCTION: allOrders.filter((order) => order.productionStatus === 'IN_PRODUCTION'),
    BLOCKED: allOrders.filter((order) => order.productionStatus === 'BLOCKED'),
    COMPLETED: allOrders.filter((order) => order.productionStatus === 'COMPLETED'),
  };
}
