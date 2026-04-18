
export enum ProductionRequestType {
    MOCKUP = 'MOCKUP',
    SAMPLE = 'SAMPLE',
}

export enum ProductionRequestStatus {
    REQUESTED = 'REQUESTED',
    IN_PROGRESS = 'IN_PROGRESS',
    READY = 'READY',
    DELIVERED = 'DELIVERED',
    REVISION_REQUESTED = 'REVISION_REQUESTED',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
}

export interface ProductionRequest {
    id: number;
    opportunity_id: number;
    type: ProductionRequestType;
    status: ProductionRequestStatus;
    requested_by: number;
    assigned_to?: number;
    title: string;
    description?: string;
    revision_count: number;
    external_url?: string;
    requested_at: Date;
    started_at?: Date;
    completed_at?: Date;
    delivered_at?: Date;
    approved_at?: Date;
    created_at: Date;
    updated_at: Date;
    sample_cost?: number;
    sample_charge_to_customer: boolean;
    sample_waived_by_rep: boolean;
    waiver_reason?: string;
    waiver_approved_by?: number;
    waiver_approved_at?: Date;
    shipping_status?: string;
    tracking_number?: string;
}
