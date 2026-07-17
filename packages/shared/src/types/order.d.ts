import type { RevenueLane } from './organization.js';
export type OrderProductionStatus = 'NEEDS_REVIEW' | 'READY_FOR_VENDOR' | 'IN_PRODUCTION' | 'BLOCKED' | 'COMPLETED';
export type OrderStage = 'ORDER_CREATED' | 'PAYMENT_CONFIRMED' | 'ARTWORK_FINALIZED' | 'VENDOR_READY' | 'IN_PRODUCTION' | 'QUALITY_CHECK' | 'SHIPPED_DELIVERED' | 'COMPLETED' | 'BLOCKED_ON_HOLD';
export interface Order {
    id: string;
    organizationId: string;
    organizationName: string;
    opportunityId: string;
    lane: RevenueLane;
    value: number;
    productionStatus: OrderProductionStatus;
    orderStage?: OrderStage;
    previousActiveStage?: OrderStage;
    title?: string;
    sport?: string;
    quantity?: number;
    dueDate?: string;
    assignedRep?: string;
    assignedDirector?: string;
    nextAction?: string;
    nextActionOwner?: string;
    paymentStatus?: string;
    artworkStatus?: string;
    vendorStatus?: string;
    shippingStatus?: string;
    customerContact?: string;
    resolutionDueDate?: string;
    completedDate?: string;
    createdAt?: string;
    updatedAt?: string;
    riskStatus?: 'red' | 'yellow' | 'green' | 'gray';
    activityIds?: string[];
    missingInfo: string[];
    vendor: string;
    createdDate: string;
    vendorNotes: string;
}
export interface Activity {
    id: string;
    entityType: 'ORGANIZATION' | 'OPPORTUNITY' | 'ORDER';
    entityId: string;
    message: string;
    timestamp: string;
    user: string;
}
//# sourceMappingURL=order.d.ts.map