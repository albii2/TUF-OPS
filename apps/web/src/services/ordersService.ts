import type { Opportunity, Order, RevenueLane, Activity } from '../data/mockSalesData';
import { apiClient } from './apiClient';

export type OrderListParams = {
  search?: string;
  productionStatus?: 'ALL' | Order['productionStatus'];
  refreshKey?: number;
};

export async function createOrder(opportunity: Opportunity): Promise<Order> {
  return apiClient<Order>('/orders', {
    method: 'POST',
    body: {
      organizationId: opportunity.organizationId,
      organizationName: opportunity.organizationName,
      opportunityId: opportunity.id,
      title: opportunity.title,
      lane: opportunity.lanes[0],
      sport: opportunity.sport,
      value: Math.round(opportunity.value),
      assignedRep: opportunity.assignedRep,
    },
  });
}

export async function updateOrder(
  id: string,
  patch: Partial<Order>,
): Promise<Order> {
  return apiClient<Order>(`/orders/${id}`, { method: 'PUT', body: patch });
}

export async function listOrders(params: OrderListParams = {}): Promise<Order[]> {
  const query: Record<string, string | undefined> = {};
  if (params.search) query.search = params.search;
  if (params.productionStatus && params.productionStatus !== 'ALL') query.productionStatus = params.productionStatus;
  const raw = await apiClient<any[]>('/orders', { query });
  return (raw || []).map(normalizeApiOrder);
}

function normalizeApiOrder(raw: any): Order {
  return {
    id: String(raw.id ?? ''),
    organizationId: String(raw.organization_id ?? ''),
    organizationName: raw.organization_name ?? raw.organizationName ?? '',
    opportunityId: String(raw.opportunity_id ?? ''),
    title: raw.title ?? raw.name ?? '',
    lane: raw.lane ?? raw.deal_type ?? 'UNIFORM',
    sport: raw.sport ?? '',
    value: Number(raw.value ?? 0),
    assignedRep: raw.assigned_rep_name ?? raw.assignedRep ?? 'Unassigned',
    assignedDirector: raw.assigned_director_name ?? raw.assignedDirector ?? 'Unassigned',
    productionStatus: mapApiStatus(raw.status ?? raw.productionStatus),
    orderStage: raw.order_stage ?? raw.orderStage ?? undefined,
    dueDate: raw.due_date ?? raw.dueDate ?? new Date().toISOString().slice(0, 10),
    createdAt: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updated_at ?? raw.updatedAt ?? undefined,
    vendor: raw.vendor ?? raw.vendor_name ?? 'Unassigned',
    missingInfo: Array.isArray(raw.missing_info) ? raw.missing_info : Array.isArray(raw.missingInfo) ? raw.missingInfo : [],
    notes: raw.notes ?? raw.production_notes ?? '',
    trackingInfo: raw.tracking_info ?? raw.trackingInfo ?? undefined,
    createdDate: raw.created_date ?? raw.createdDate ?? undefined,
    vendorNotes: raw.vendor_notes ?? raw.vendorNotes ?? '',
  } as unknown as Order;
}

function mapApiStatus(status: string): Order['productionStatus'] {
  switch (status?.toUpperCase?.()) {
    case 'CREATED':
    case 'NEEDS_REVIEW': return 'NEEDS_REVIEW';
    case 'READY_FOR_VENDOR': return 'READY_FOR_VENDOR';
    case 'IN_PRODUCTION': return 'IN_PRODUCTION';
    case 'BLOCKED': return 'BLOCKED';
    case 'COMPLETED': return 'COMPLETED';
    default: return 'NEEDS_REVIEW';
  }
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  try {
    return await apiClient<Order>(`/orders/${id}`);
  } catch {
    return undefined;
  }
}

export function getOrderByOpportunityId(opportunityId?: string): Promise<Order | undefined> {
  if (!opportunityId) return Promise.resolve(undefined);
  return getOrderById(opportunityId).then((order) => order || undefined);
}

export async function getAnyOrderByOpportunityId(opportunityId?: string): Promise<Order | undefined> {
  if (!opportunityId) return undefined;
  const orders = await listOrders({});
  return orders.find((order) => order.opportunityId === opportunityId);
}

export async function getOpsWorkspaceQueues() {
  const allOrders = await listOrders({});
  return {
    NEEDS_REVIEW: allOrders.filter((order) => order.productionStatus === 'NEEDS_REVIEW'),
    READY_FOR_VENDOR: allOrders.filter((order) => order.productionStatus === 'READY_FOR_VENDOR'),
    IN_PRODUCTION: allOrders.filter((order) => order.productionStatus === 'IN_PRODUCTION'),
    BLOCKED: allOrders.filter((order) => order.productionStatus === 'BLOCKED'),
    COMPLETED: allOrders.filter((order) => order.productionStatus === 'COMPLETED'),
  };
}
