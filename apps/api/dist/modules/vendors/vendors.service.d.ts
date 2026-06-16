import { Vendor, VendorAgreement, VendorPerformanceMetric, VendorPayment, VendorOrderMapping, VendorStatus } from './vendors.interface';
export declare function createVendor(vendorData: Partial<Vendor>): Promise<Vendor>;
export declare function getVendorById(id: number): Promise<Vendor | null>;
export declare function getVendors(filters?: {
    status?: VendorStatus;
    tier?: string;
    limit?: number;
    offset?: number;
}): Promise<Vendor[]>;
export declare function updateVendor(id: number, updates: Partial<Vendor>): Promise<Vendor>;
export declare function createVendorAgreement(agreementData: Partial<VendorAgreement>): Promise<VendorAgreement>;
export declare function getVendorAgreements(vendorId: number): Promise<VendorAgreement[]>;
export declare function getActiveVendorAgreement(vendorId: number): Promise<VendorAgreement | null>;
export declare function recordVendorPerformance(metric: Partial<VendorPerformanceMetric>): Promise<VendorPerformanceMetric>;
export declare function getVendorPerformance(vendorId: number, monthsBack?: number): Promise<VendorPerformanceMetric[]>;
export declare function createVendorPayment(paymentData: Partial<VendorPayment>): Promise<VendorPayment>;
export declare function getVendorPayments(vendorId: number, filters?: {
    status?: string;
}): Promise<VendorPayment[]>;
export declare function updateVendorPaymentStatus(paymentId: number, status: string): Promise<VendorPayment>;
export declare function assignOrderToVendor(orderId: number, vendorId: number, quantityAllocated?: number, notes?: string): Promise<VendorOrderMapping>;
export declare function getOrderVendorAssignments(orderId: number): Promise<VendorOrderMapping[]>;
export declare function getVendorActiveOrders(vendorId: number): Promise<any[]>;
export declare function updateOrderVendorSettlement(orderId: number, settlementData: {
    vendor_settlement_status: string;
    vendor_invoice_id?: string;
    vendor_invoice_date?: Date;
    vendor_payment_due_date?: Date;
    vendor_paid_date?: Date;
    vendor_payment_amount?: number;
}): Promise<any>;
export declare function getPendingVendorPayments(): Promise<any[]>;
export declare function getVendorCapacityUtilization(vendorId: number, month?: Date): Promise<any>;
export declare function getAllVendorsCapacityStatus(month?: Date): Promise<any[]>;
//# sourceMappingURL=vendors.service.d.ts.map