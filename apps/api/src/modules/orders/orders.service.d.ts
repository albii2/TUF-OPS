import { Order, OrderStatus } from './orders.interface';
export declare function getOrderById(id: number): Promise<Order | null>;
export declare function getOrderByOpportunityId(opportunityId: number): Promise<Order | null>;
export declare function getOrders(): Promise<Order[]>;
export declare function createOrderFromOpportunity(opportunityId: number, options?: {
    errorOnDuplicate?: boolean;
}): Promise<Order>;
export declare function ensureOrderFromClosedWonOpportunity(opportunityId: number): Promise<Order>;
export declare function updateOrderStatus(id: number, status: OrderStatus): Promise<Order>;
export declare function getOrdersByVendor(vendorId: number): Promise<Order[]>;
export declare function getOrdersByStatus(status: OrderStatus): Promise<Order[]>;
//# sourceMappingURL=orders.service.d.ts.map