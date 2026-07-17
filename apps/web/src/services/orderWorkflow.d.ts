import type { Opportunity, Order } from '../data/mockSalesData';
export type OrderStage = 'ORDER_CREATED' | 'PAYMENT_CONFIRMED' | 'ARTWORK_FINALIZED' | 'VENDOR_READY' | 'IN_PRODUCTION' | 'QUALITY_CHECK' | 'SHIPPED_DELIVERED' | 'COMPLETED' | 'BLOCKED_ON_HOLD';
export type OrderQueueFilter = 'ACTION_NEEDED' | 'IN_PRODUCTION' | 'BLOCKED' | 'COMPLETED' | 'ALL';
export type OrderRiskLevel = 'red' | 'yellow' | 'green' | 'gray';
export declare const ORDER_STAGE_FLOW: OrderStage[];
export declare const ORDER_STAGE_LABELS: Record<OrderStage, string>;
export type AdvancementField = {
    key: string;
    label: string;
    type?: 'text' | 'number' | 'date' | 'textarea' | 'select';
    required?: boolean;
    options?: string[];
};
export declare const BLOCKER_FIELDS: AdvancementField[];
export declare function getOrderStage(order: Order): OrderStage;
export declare function getOrderStageLabel(stageOrOrder: OrderStage | Order): any;
export declare function toProductionStatus(stage: OrderStage): Order['productionStatus'];
export declare function getPreviousActiveStage(order: Order): OrderStage;
export declare function getNextOrderStage(order: Order): OrderStage | null;
export declare function getAdvanceFields(stage: OrderStage): AdvancementField[];
export declare function getOrderTitle(order: Order, opportunity?: Opportunity): any;
export declare function getOrderOwner(order: Order, opportunity?: Opportunity): any;
export declare function getOrderDueDate(order: Order): any;
export declare function getOrderNextAction(order: Order): any;
export declare function getOrderRisk(order: Order): {
    level: OrderRiskLevel;
    label: string;
    reason: string;
    rank: number;
    tone: string;
};
export declare function matchesOrderQueueFilter(order: Order, filter: OrderQueueFilter): boolean;
export declare function sortOrdersForExecution(a: Order, b: Order): any;
export declare function canAdvanceOrder(order: Order, opportunity?: Opportunity): boolean;
export declare function getOrderAdvanceWarning(order: Order, opportunity?: Opportunity): "" | "Log in before updating this order." | "You are updating this order as a director. This action will be logged." | "You can only advance orders assigned to you.";
export declare function canSeeOrderValue(): boolean;
//# sourceMappingURL=orderWorkflow.d.ts.map