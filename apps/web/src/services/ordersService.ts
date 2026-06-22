import { opportunities, orders as seededOrders, type Opportunity, type Order } from '../data/mockSalesData';
import { getStoredUser } from '../auth';
import { DATA_MODE } from './dataMode';
import { canViewOrder } from './roleScope';
import { getOrderNextAction, getOrderStage, toProductionStatus, type OrderStage } from './orderWorkflow';

export type OrderListParams = {
  search?: string;
  productionStatus?: 'ALL' | Order['productionStatus'];
  refreshKey?: number;
};

const LOCAL_ORDERS_KEY = 'tuf_ops_mock_orders_v1';
const LOCAL_OPPORTUNITIES_KEY = 'tuf_ops_opportunities_v2';
const LEGACY_LOCAL_OPPORTUNITIES_KEY = 'tuf_ops_mock_opportunities_v1';
const LOCAL_ACTIVITIES_KEY = 'tuf_ops_mock_activities_v1';

type AdvancementPatch = Partial<Order> & {
  orderStage?: OrderStage;
  advancementNotes?: string;
};

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

function readLocalActivities() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ACTIVITIES_KEY) || '[]') as { id: string; entityType: 'ORGANIZATION' | 'OPPORTUNITY' | 'ORDER'; entityId: string; message: string; timestamp: string; user: string }[];
  } catch {
    return [];
  }
}

function writeLocalActivity(input: { entityType: 'ORGANIZATION' | 'OPPORTUNITY' | 'ORDER'; entityId: string; message: string }) {
  const user = getStoredUser();
  const row = {
    id: `act-local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    entityType: input.entityType,
    entityId: input.entityId,
    message: input.message,
    timestamp: new Date().toISOString(),
    user: user?.name ?? 'System',
  };
  localStorage.setItem(LOCAL_ACTIVITIES_KEY, JSON.stringify([row, ...readLocalActivities()]));
}

function getAllOpportunities(): Opportunity[] {
  try {
    const current = JSON.parse(localStorage.getItem(LOCAL_OPPORTUNITIES_KEY) || '[]') as Opportunity[];
    const legacy = JSON.parse(localStorage.getItem(LEGACY_LOCAL_OPPORTUNITIES_KEY) || '[]') as Opportunity[];
    const currentIds = new Set(current.map((row) => row.id));
    const local = [...current, ...legacy.filter((row) => !currentIds.has(row.id))];
    const localIds = new Set(local.map((row) => row.id));
    return [...local, ...opportunities.filter((row) => !localIds.has(row.id))];
  } catch {
    return opportunities;
  }
}

function getAllOrders() {
  const localRows = readLocalOrders();
  const localIds = new Set(localRows.map((row) => row.id));
  return [...localRows, ...seededOrders.filter((row) => !localIds.has(row.id))];
}

function findAnyOrderByOpportunityId(opportunityId: string) {
  return getAllOrders().find((order) => order.opportunityId === opportunityId);
}

function writeLocalOpportunities(rows: Opportunity[]) {
  localStorage.setItem(LOCAL_OPPORTUNITIES_KEY, JSON.stringify(rows));
}

function writeLegacyOpportunities(rows: Opportunity[]) {
  localStorage.setItem(LEGACY_LOCAL_OPPORTUNITIES_KEY, JSON.stringify(rows));
}

function linkOpportunityToOrder(opportunity: Opportunity, orderId: string) {
  const patch = { ...opportunity, orderId, updatedAt: new Date().toISOString() };
  writeLocalOpportunities([patch, ...((JSON.parse(localStorage.getItem(LOCAL_OPPORTUNITIES_KEY) || '[]') as Opportunity[]).filter((row) => row.id !== opportunity.id))]);
  writeLegacyOpportunities((JSON.parse(localStorage.getItem(LEGACY_LOCAL_OPPORTUNITIES_KEY) || '[]') as Opportunity[]).filter((row) => row.id !== opportunity.id));
}

function getInitialOrderOwner(opportunity: Opportunity) {
  const user = getStoredUser();
  if (user && ['OWNER', 'DIRECTOR', 'OPS'].includes(user.role)) return user.name;
  return opportunity.assignedRep;
}

export function listOrders(params: OrderListParams = {}): Order[] {
  const allOpportunities = getAllOpportunities();
  return getAllOrders().filter((order) => {
    const stageLabel = getOrderStage(order);
    const matchesSearch = (params.search ?? '').trim()
      ? [order.id, order.title, order.organizationName, order.vendor, stageLabel].join(' ').toLowerCase().includes((params.search ?? '').toLowerCase())
      : true;
    const matchesStatus = !params.productionStatus || params.productionStatus === 'ALL' || order.productionStatus === params.productionStatus;
    const linkedOpportunity = allOpportunities.find((opp) => opp.id === order.opportunityId);
    const roleScoped = canViewOrder(order, linkedOpportunity);
    return matchesSearch && matchesStatus && roleScoped;
  });
}

export function getOrderById(id: string): Order | undefined {
  return listOrders({}).find((order) => order.id === id);
}

export function getOrderByOpportunityId(opportunityId?: string): Order | undefined {
  if (!opportunityId) return undefined;
  return listOrders({}).find((order) => order.opportunityId === opportunityId);
}

export function getAnyOrderByOpportunityId(opportunityId?: string): Order | undefined {
  if (!opportunityId) return undefined;
  return findAnyOrderByOpportunityId(opportunityId);
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

export function createMockOrderFromOpportunity(opportunity?: Opportunity): Order {
  if (!opportunity) throw new Error('Select a closed-won opportunity before creating an order.');
  if (opportunity.stage !== 'CLOSED_WON') throw new Error('Orders can only be created from closed-won opportunities.');

  const existing = findAnyOrderByOpportunityId(opportunity.id);
  if (existing) {
    linkOpportunityToOrder(opportunity, existing.id);
    return existing;
  }

  const now = new Date().toISOString();
  const order: Order = {
    id: `ord-local-${Date.now()}`,
    organizationId: opportunity.organizationId,
    organizationName: opportunity.organizationName,
    opportunityId: opportunity.id,
    title: opportunity.title,
    lane: opportunity.lane,
    sport: opportunity.sport,
    value: Math.round(opportunity.value),
    productionStatus: 'NEEDS_REVIEW',
    orderStage: 'ORDER_CREATED',
    missingInfo: ['Handoff package review'],
    vendor: 'Unassigned',
    assignedRep: opportunity.assignedRep,
    assignedDirector: opportunity.assignedDirector,
    nextActionOwner: getInitialOrderOwner(opportunity),
    nextAction: 'Confirm payment / prepare production handoff',
    dueDate: now.slice(0, 10),
    riskStatus: 'red',
    paymentStatus: 'Pending confirmation',
    artworkStatus: 'Needs approval',
    vendorStatus: 'Vendor not selected',
    shippingStatus: 'Not shipped',
    createdDate: now.slice(0, 10),
    createdAt: now,
    updatedAt: now,
    activityIds: [],
    vendorNotes: 'New order created from closed-won opportunity. Review payment and handoff package before vendor routing.',
  };
  writeLocalOrders([order, ...readLocalOrders().filter((row) => row.id !== order.id)]);
  linkOpportunityToOrder(opportunity, order.id);
  writeLocalActivity({ entityType: 'ORDER', entityId: order.id, message: 'Order created from Closed Won opportunity.' });
  writeLocalActivity({ entityType: 'OPPORTUNITY', entityId: opportunity.id, message: 'Order handoff created.' });
  return order;
}

function buildUpdatedOrder(existing: Order, patch: AdvancementPatch): Order {
  const nextStage = patch.orderStage ?? existing.orderStage;
  const productionStatus = nextStage ? toProductionStatus(nextStage) : patch.productionStatus ?? existing.productionStatus;
  const stageChanged = nextStage && nextStage !== getOrderStage(existing);
  const missingInfo = nextStage === 'BLOCKED_ON_HOLD'
    ? [patch.advancementNotes || patch.vendorNotes || existing.missingInfo[0] || 'Order on hold']
    : stageChanged && nextStage !== 'ORDER_CREATED'
      ? []
      : patch.missingInfo ?? existing.missingInfo;
  const nextAction = patch.nextAction ?? getOrderNextAction({
    ...existing,
    ...patch,
    productionStatus,
    orderStage: nextStage,
    missingInfo,
    nextAction: stageChanged ? undefined : existing.nextAction,
  } as Order);

  return {
    ...existing,
    ...patch,
    productionStatus,
    orderStage: nextStage,
    previousActiveStage: nextStage === 'BLOCKED_ON_HOLD' ? getOrderStage(existing) : existing.previousActiveStage,
    missingInfo,
    nextAction,
    updatedAt: new Date().toISOString(),
  } as Order;
}

export function updateMockOrder(id: string, patch: AdvancementPatch) {
  const existing = getAllOrders().find((order) => order.id === id);
  if (!existing) throw new Error('Order not found.');
  const updated = buildUpdatedOrder(existing, patch);
  writeLocalOrders([updated, ...readLocalOrders().filter((order) => order.id !== id)]);
  if (patch.orderStage && patch.orderStage !== getOrderStage(existing)) {
    writeLocalActivity({ entityType: 'ORDER', entityId: id, message: `Stage changed from ${getOrderStage(existing)} to ${patch.orderStage}.` });
  } else {
    writeLocalActivity({ entityType: 'ORDER', entityId: id, message: 'Order details updated.' });
  }
  return updated;
}
