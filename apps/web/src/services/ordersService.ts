import { orders, type Order } from '../data/mockSalesData';
import { DATA_MODE } from './dataMode';
import { opportunities, type Opportunity } from '../data/mockSalesData';
import { canViewOrder } from './roleScope';

export type OrderListParams = {
  search?: string;
  productionStatus?: 'ALL' | Order['productionStatus'];
  refreshKey?: number;
};

const LOCAL_ORDERS_KEY = 'tuf_ops_mock_orders_v1';

function readLocalOrders(): Order[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY) || '[]') as Order[];
  } catch {
    return [];
  }
}

function writeLocalOrders(rows: Order[]) {
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(rows));
}

function getAllOpportunities(): Opportunity[] {
  try {
    const local = JSON.parse(localStorage.getItem('tuf_ops_mock_opportunities_v1') || '[]') as Opportunity[];
    const localIds = new Set(local.map((row) => row.id));
    return [...local, ...opportunities.filter((row) => !localIds.has(row.id))];
  } catch {
    return opportunities;
  }
}

function getAllOrders() {
  const localRows = readLocalOrders();
  const localIds = new Set(localRows.map((row) => row.id));
  return [...localRows, ...orders.filter((row) => !localIds.has(row.id))];
}

export function listOrders(params: OrderListParams = {}): Order[] {
  if (DATA_MODE !== 'mock') return [];

  const allOpportunities = getAllOpportunities();
  return getAllOrders().filter((order) => {
    const matchesSearch = (params.search ?? '').trim()
      ? [order.id, order.organizationName, order.vendor].join(' ').toLowerCase().includes((params.search ?? '').toLowerCase())
      : true;
    const matchesStatus = !params.productionStatus || params.productionStatus === 'ALL' || order.productionStatus === params.productionStatus;
    const linkedOpportunity = allOpportunities.find((o) => o.id === order.opportunityId);
    const roleScoped = canViewOrder(order, linkedOpportunity);
    return matchesSearch && matchesStatus && roleScoped;
  });
}

export function getOrderById(id: string): Order | undefined {
  if (DATA_MODE !== 'mock') return undefined;
  return listOrders({}).find((order) => order.id === id);
}

export function getOpsWorkspaceQueues() {
  if (DATA_MODE !== 'mock') {
    return { NEEDS_REVIEW: [], READY_FOR_VENDOR: [], IN_PRODUCTION: [], BLOCKED: [], COMPLETED: [] } as Record<Order['productionStatus'], Order[]>;
  }
  const visibleOrders = listOrders({});
  return {
    NEEDS_REVIEW: visibleOrders.filter((order) => order.productionStatus === 'NEEDS_REVIEW'),
    READY_FOR_VENDOR: visibleOrders.filter((order) => order.productionStatus === 'READY_FOR_VENDOR'),
    IN_PRODUCTION: visibleOrders.filter((order) => order.productionStatus === 'IN_PRODUCTION'),
    BLOCKED: visibleOrders.filter((order) => order.productionStatus === 'BLOCKED'),
    COMPLETED: visibleOrders.filter((order) => order.productionStatus === 'COMPLETED'),
  };
}

export function createMockOrderFromOpportunity(opportunity?: Opportunity): Order {
  if (!opportunity) throw new Error('Select a closed-won opportunity before creating an order.');
  if (opportunity.stage !== 'CLOSED_WON') throw new Error('Orders can only be created from closed-won opportunities.');
  if (getAllOrders().some((order) => order.opportunityId === opportunity.id)) throw new Error('An order already exists for this opportunity.');

  const order: Order = {
    id: `ord-local-${Date.now()}`,
    organizationId: opportunity.organizationId,
    organizationName: opportunity.organizationName,
    opportunityId: opportunity.id,
    lane: opportunity.lane,
    value: Math.round(opportunity.value),
    productionStatus: 'NEEDS_REVIEW',
    missingInfo: ['Handoff package review'],
    vendor: 'Unassigned',
    createdDate: new Date().toISOString().slice(0, 10),
    vendorNotes: 'New order created from closed-won opportunity. Review handoff package before vendor routing.',
  };
  writeLocalOrders([order, ...readLocalOrders()]);
  return order;
}

export function updateMockOrder(id: string, patch: Partial<Pick<Order, 'productionStatus' | 'vendorNotes'>>) {
  const existing = getAllOrders().find((order) => order.id === id);
  if (!existing) throw new Error('Order not found.');
  const updated: Order = {
    ...existing,
    ...patch,
    missingInfo: patch.productionStatus && patch.productionStatus !== 'NEEDS_REVIEW' ? [] : existing.missingInfo,
  };
  writeLocalOrders([updated, ...readLocalOrders().filter((order) => order.id !== id)]);
  return updated;
}
