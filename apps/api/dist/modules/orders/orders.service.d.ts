import { Order } from './orders.interface';
export declare function getOrderById(id: number): Promise<Order | null>;
export declare function getOrderByOpportunityId(opportunityId: number): Promise<Order | null>;
export declare function createOrderFromOpportunity(opportunityId: number): Promise<Order>;
//# sourceMappingURL=orders.service.d.ts.map