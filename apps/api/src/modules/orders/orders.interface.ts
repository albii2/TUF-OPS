
export enum OrderStatus {
    CREATED = 'CREATED',
    IN_PRODUCTION = 'IN_PRODUCTION',
    IN_TRANSIT = 'IN_TRANSIT',
    DELIVERED = 'DELIVERED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export interface Order {
    id: number;
    opportunity_id: number;
    organization_id: number;
    deal_type: string;
    status: OrderStatus;
    assigned_rep_id?: number;
    assigned_director_id?: number;
    vendor_id?: number;
    production_notes?: string;
    tracking_info?: any;
    delivery_date?: Date;
    created_at: Date;
    updated_at: Date;
}
