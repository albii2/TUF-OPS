export enum VendorStatus {
  PROSPECT = 'PROSPECT',
  QUALIFIED = 'QUALIFIED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum VendorTier {
  PREMIUM = 'PREMIUM',
  HIGH_VOLUME = 'HIGH_VOLUME',
  MID_RANGE = 'MID_RANGE',
}

export enum PaymentTerms {
  NET_30 = 'NET_30',
  NET_60 = 'NET_60',
  DEPOSIT_50 = 'DEPOSIT_50',
  DEPOSIT_100 = 'DEPOSIT_100',
  COD = 'COD',
}

export interface Vendor {
  id: number;
  name: string;
  location?: string;
  country?: string;
  specialization?: string;
  contact_email?: string;
  contact_phone?: string;
  primary_contact_name?: string;
  monthly_capacity_min?: number;
  monthly_capacity_max?: number;
  price_per_unit_min?: number;
  price_per_unit_max?: number;
  lead_time_standard_days?: number;
  lead_time_expedite_days?: number;
  minimum_order_qty?: number;
  status: VendorStatus;
  tier?: VendorTier;
  certifications?: string[];
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface VendorAgreement {
  id: number;
  vendor_id: number;
  agreement_date: Date;
  effective_date?: Date;
  expiry_date?: Date;
  payment_terms: PaymentTerms;
  currency?: string;
  price_per_unit: number;
  minimum_order_qty?: number;
  price_tier_volume_1?: number;
  price_tier_volume_2?: number;
  status: string;
  terms_conditions?: string;
  created_at: Date;
  updated_at: Date;
}

export interface VendorPerformanceMetric {
  id: number;
  vendor_id: number;
  metric_month: Date;
  total_orders: number;
  on_time_delivery_count: number;
  on_time_delivery_percentage?: number;
  defect_rate_percentage?: number;
  average_quality_score?: number;
  communication_response_hours?: number;
  price_variance_percentage?: number;
  volume_flexibility_score?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface VendorPayment {
  id: number;
  vendor_id: number;
  payment_date: Date;
  amount: number;
  currency?: string;
  payment_method?: string;
  reference?: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED' | 'CANCELLED';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface VendorOrderMapping {
  id: number;
  order_id: number;
  vendor_id: number;
  assigned_date: Date;
  quantity_allocated?: number;
  notes?: string;
}
