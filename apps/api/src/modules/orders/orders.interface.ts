
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
    vendor_settlement_status?: 'PENDING' | 'INVOICED' | 'PAID' | 'DISPUTED' | 'REFUNDED';
    vendor_invoice_id?: string;
    vendor_invoice_date?: Date;
    vendor_payment_due_date?: Date;
    vendor_paid_date?: Date;
    order_value?: number;
    vendor_payment_amount?: number;
    quantity_ordered?: number;
    unit_price?: number;
    created_at: Date;
    updated_at: Date;
}
