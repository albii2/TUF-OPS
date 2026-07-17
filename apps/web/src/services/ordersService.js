import { apiClient } from './apiClient';
export async function createOrder(opportunity) {
    return apiClient('/orders', {
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
export async function updateOrder(id, patch) {
    return apiClient(`/orders/${id}`, { method: 'PUT', body: patch });
}
export async function listOrders(params = {}) {
    const query = {};
    if (params.search)
        query.search = params.search;
    if (params.productionStatus && params.productionStatus !== 'ALL')
        query.productionStatus = params.productionStatus;
    return apiClient('/orders', { query });
}
export async function getOrderById(id) {
    try {
        return await apiClient(`/orders/${id}`);
    }
    catch {
        return undefined;
    }
}
export function getOrderByOpportunityId(opportunityId) {
    if (!opportunityId)
        return Promise.resolve(undefined);
    return getOrderById(opportunityId).then((order) => order || undefined);
}
export async function getAnyOrderByOpportunityId(opportunityId) {
    if (!opportunityId)
        return undefined;
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
//# sourceMappingURL=ordersService.js.map