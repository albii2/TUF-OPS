import type { Opportunity, Order } from '../data/mockSalesData';
export type OrderListParams = {
    search?: string;
    productionStatus?: 'ALL' | Order['productionStatus'];
    refreshKey?: number;
};
export declare function createOrder(opportunity: Opportunity): Promise<Order>;
export declare function updateOrder(id: string, patch: Partial<Order>): Promise<Order>;
export declare function listOrders(params?: OrderListParams): Promise<Order[]>;
export declare function getOrderById(id: string): Promise<Order | undefined>;
export declare function getOrderByOpportunityId(opportunityId?: string): Promise<Order | undefined>;
export declare function getAnyOrderByOpportunityId(opportunityId?: string): Promise<Order | undefined>;
export declare function getOpsWorkspaceQueues(): Promise<{
    NEEDS_REVIEW: Order[];
    READY_FOR_VENDOR: Order[];
    IN_PRODUCTION: Order[];
    BLOCKED: Order[];
    COMPLETED: Order[];
}>;
//# sourceMappingURL=ordersService.d.ts.map