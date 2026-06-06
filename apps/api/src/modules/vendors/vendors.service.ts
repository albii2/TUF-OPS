import { pool } from '@packages/database';
import {
  Vendor,
  VendorAgreement,
  VendorPerformanceMetric,
  VendorPayment,
  VendorOrderMapping,
  VendorStatus,
  PaymentTerms,
} from './vendors.interface';

// Vendor Management
export async function createVendor(vendorData: Partial<Vendor>): Promise<Vendor> {
  const {
    name,
    location,
    country,
    specialization,
    contact_email,
    contact_phone,
    primary_contact_name,
    monthly_capacity_min,
    monthly_capacity_max,
    price_per_unit_min,
    price_per_unit_max,
    lead_time_standard_days,
    lead_time_expedite_days,
    minimum_order_qty,
    status,
    tier,
    certifications,
    notes,
  } = vendorData;

  const result = await pool.query(
    `INSERT INTO vendors (
      name, location, country, specialization, contact_email, contact_phone,
      primary_contact_name, monthly_capacity_min, monthly_capacity_max,
      price_per_unit_min, price_per_unit_max, lead_time_standard_days,
      lead_time_expedite_days, minimum_order_qty, status, tier, certifications, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *`,
    [
      name,
      location,
      country || 'Pakistan',
      specialization,
      contact_email,
      contact_phone,
      primary_contact_name,
      monthly_capacity_min,
      monthly_capacity_max,
      price_per_unit_min,
      price_per_unit_max,
      lead_time_standard_days,
      lead_time_expedite_days,
      minimum_order_qty,
      status || VendorStatus.PROSPECT,
      tier,
      certifications,
      notes,
    ]
  );

  return result.rows[0];
}

export async function getVendorById(id: number): Promise<Vendor | null> {
  const result = await pool.query('SELECT * FROM vendors WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getVendors(filters?: {
  status?: VendorStatus;
  tier?: string;
  limit?: number;
  offset?: number;
}): Promise<Vendor[]> {
  let query = 'SELECT * FROM vendors WHERE 1=1';
  const params: any[] = [];

  if (filters?.status) {
    query += ` AND status = $${params.length + 1}`;
    params.push(filters.status);
  }

  if (filters?.tier) {
    query += ` AND tier = $${params.length + 1}`;
    params.push(filters.tier);
  }

  query += ' ORDER BY name ASC';

  if (filters?.limit) {
    query += ` LIMIT $${params.length + 1}`;
    params.push(filters.limit);
  }

  if (filters?.offset) {
    query += ` OFFSET $${params.length + 1}`;
    params.push(filters.offset);
  }

  const result = await pool.query(query, params);
  return result.rows;
}

export async function updateVendor(id: number, updates: Partial<Vendor>): Promise<Vendor> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  });

  fields.push(`updated_at = $${paramCount}`);
  values.push(new Date());
  values.push(id);

  const query = `UPDATE vendors SET ${fields.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`;

  const result = await pool.query(query, values);
  return result.rows[0];
}

// Vendor Agreements
export async function createVendorAgreement(agreementData: Partial<VendorAgreement>): Promise<VendorAgreement> {
  const {
    vendor_id,
    effective_date,
    expiry_date,
    payment_terms,
    currency,
    price_per_unit,
    minimum_order_qty,
    price_tier_volume_1,
    price_tier_volume_2,
    terms_conditions,
  } = agreementData;

  const result = await pool.query(
    `INSERT INTO vendor_agreements (
      vendor_id, effective_date, expiry_date, payment_terms, currency,
      price_per_unit, minimum_order_qty, price_tier_volume_1, price_tier_volume_2, terms_conditions
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      vendor_id,
      effective_date,
      expiry_date,
      payment_terms,
      currency || 'USD',
      price_per_unit,
      minimum_order_qty,
      price_tier_volume_1,
      price_tier_volume_2,
      terms_conditions,
    ]
  );

  return result.rows[0];
}

export async function getVendorAgreements(vendorId: number): Promise<VendorAgreement[]> {
  const result = await pool.query(
    'SELECT * FROM vendor_agreements WHERE vendor_id = $1 ORDER BY created_at DESC',
    [vendorId]
  );
  return result.rows;
}

export async function getActiveVendorAgreement(vendorId: number): Promise<VendorAgreement | null> {
  const result = await pool.query(
    `SELECT * FROM vendor_agreements
     WHERE vendor_id = $1 AND status = 'ACTIVE'
     AND (expiry_date IS NULL OR expiry_date > NOW())
     ORDER BY created_at DESC LIMIT 1`,
    [vendorId]
  );
  return result.rows[0] || null;
}

// Vendor Performance Metrics
export async function recordVendorPerformance(metric: Partial<VendorPerformanceMetric>): Promise<VendorPerformanceMetric> {
  const result = await pool.query(
    `INSERT INTO vendor_performance_metrics (
      vendor_id, metric_month, total_orders, on_time_delivery_count,
      on_time_delivery_percentage, defect_rate_percentage, average_quality_score,
      communication_response_hours, price_variance_percentage, volume_flexibility_score, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (vendor_id, metric_month) DO UPDATE SET
      total_orders = $3, on_time_delivery_count = $4,
      on_time_delivery_percentage = $5, defect_rate_percentage = $6,
      average_quality_score = $7, communication_response_hours = $8,
      price_variance_percentage = $9, volume_flexibility_score = $10,
      notes = $11, updated_at = NOW()
    RETURNING *`,
    [
      metric.vendor_id,
      metric.metric_month,
      metric.total_orders || 0,
      metric.on_time_delivery_count || 0,
      metric.on_time_delivery_percentage,
      metric.defect_rate_percentage,
      metric.average_quality_score,
      metric.communication_response_hours,
      metric.price_variance_percentage,
      metric.volume_flexibility_score,
      metric.notes,
    ]
  );

  return result.rows[0];
}

export async function getVendorPerformance(vendorId: number, monthsBack: number = 6): Promise<VendorPerformanceMetric[]> {
  const result = await pool.query(
    `SELECT * FROM vendor_performance_metrics
     WHERE vendor_id = $1 AND metric_month >= NOW() - INTERVAL '${monthsBack} months'
     ORDER BY metric_month DESC`,
    [vendorId]
  );
  return result.rows;
}

// Vendor Payments
export async function createVendorPayment(paymentData: Partial<VendorPayment>): Promise<VendorPayment> {
  const { vendor_id, payment_date, amount, currency, payment_method, reference, status, notes } = paymentData;

  const result = await pool.query(
    `INSERT INTO vendor_payments (
      vendor_id, payment_date, amount, currency, payment_method, reference, status, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [vendor_id, payment_date, amount, currency || 'USD', payment_method, reference, status || 'PENDING', notes]
  );

  return result.rows[0];
}

export async function getVendorPayments(vendorId: number, filters?: { status?: string }): Promise<VendorPayment[]> {
  let query = 'SELECT * FROM vendor_payments WHERE vendor_id = $1';
  const params: any[] = [vendorId];

  if (filters?.status) {
    query += ` AND status = $2`;
    params.push(filters.status);
  }

  query += ' ORDER BY payment_date DESC';

  const result = await pool.query(query, params);
  return result.rows;
}

export async function updateVendorPaymentStatus(paymentId: number, status: string): Promise<VendorPayment> {
  const result = await pool.query(
    'UPDATE vendor_payments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, paymentId]
  );
  return result.rows[0];
}

// Vendor Order Mapping
export async function assignOrderToVendor(
  orderId: number,
  vendorId: number,
  quantityAllocated?: number,
  notes?: string
): Promise<VendorOrderMapping> {
  const result = await pool.query(
    `INSERT INTO vendor_order_mapping (order_id, vendor_id, quantity_allocated, notes)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [orderId, vendorId, quantityAllocated, notes]
  );

  // Also update the orders table with vendor_id
  await pool.query('UPDATE orders SET vendor_id = $1 WHERE id = $2', [vendorId, orderId]);

  return result.rows[0];
}

export async function getOrderVendorAssignments(orderId: number): Promise<VendorOrderMapping[]> {
  const result = await pool.query(
    'SELECT * FROM vendor_order_mapping WHERE order_id = $1 ORDER BY assigned_date DESC',
    [orderId]
  );
  return result.rows;
}

export async function getVendorActiveOrders(vendorId: number): Promise<any[]> {
  const result = await pool.query(
    `SELECT o.*, vom.quantity_allocated
     FROM orders o
     JOIN vendor_order_mapping vom ON o.id = vom.order_id
     WHERE o.vendor_id = $1 AND o.status IN ('CREATED', 'IN_PRODUCTION', 'IN_TRANSIT')
     ORDER BY o.created_at DESC`,
    [vendorId]
  );
  return result.rows;
}

// Vendor Settlement
export async function updateOrderVendorSettlement(
  orderId: number,
  settlementData: {
    vendor_settlement_status: string;
    vendor_invoice_id?: string;
    vendor_invoice_date?: Date;
    vendor_payment_due_date?: Date;
    vendor_paid_date?: Date;
    vendor_payment_amount?: number;
  }
): Promise<any> {
  const result = await pool.query(
    `UPDATE orders SET
      vendor_settlement_status = $1,
      vendor_invoice_id = $2,
      vendor_invoice_date = $3,
      vendor_payment_due_date = $4,
      vendor_paid_date = $5,
      vendor_payment_amount = $6,
      updated_at = NOW()
     WHERE id = $7 RETURNING *`,
    [
      settlementData.vendor_settlement_status,
      settlementData.vendor_invoice_id,
      settlementData.vendor_invoice_date,
      settlementData.vendor_payment_due_date,
      settlementData.vendor_paid_date,
      settlementData.vendor_payment_amount,
      orderId,
    ]
  );
  return result.rows[0];
}

export async function getPendingVendorPayments(): Promise<any[]> {
  const result = await pool.query(
    `SELECT o.*, v.name as vendor_name, v.contact_email
     FROM orders o
     JOIN vendors v ON o.vendor_id = v.id
     WHERE o.vendor_settlement_status IN ('PENDING', 'INVOICED')
     AND o.vendor_payment_due_date <= NOW()
     ORDER BY o.vendor_payment_due_date ASC`
  );
  return result.rows;
}

// Analytics
export async function getVendorCapacityUtilization(vendorId: number, month?: Date): Promise<any> {
  const filterMonth = month || new Date();
  const monthStart = new Date(filterMonth.getFullYear(), filterMonth.getMonth(), 1);
  const monthEnd = new Date(filterMonth.getFullYear(), filterMonth.getMonth() + 1, 0);

  const result = await pool.query(
    `SELECT
      v.id, v.name, v.monthly_capacity_max,
      COUNT(o.id) as orders_count,
      SUM(vom.quantity_allocated) as total_quantity_allocated
     FROM vendors v
     LEFT JOIN vendor_order_mapping vom ON v.id = vom.vendor_id
     LEFT JOIN orders o ON o.id = vom.order_id AND o.created_at BETWEEN $1 AND $2
     WHERE v.id = $3
     GROUP BY v.id, v.name, v.monthly_capacity_max`,
    [monthStart, monthEnd, vendorId]
  );

  return result.rows[0] || null;
}

export async function getAllVendorsCapacityStatus(month?: Date): Promise<any[]> {
  const filterMonth = month || new Date();
  const monthStart = new Date(filterMonth.getFullYear(), filterMonth.getMonth(), 1);
  const monthEnd = new Date(filterMonth.getFullYear(), filterMonth.getMonth() + 1, 0);

  const result = await pool.query(
    `SELECT
      v.id, v.name, v.status, v.monthly_capacity_max,
      COUNT(o.id) as orders_count,
      SUM(vom.quantity_allocated) as total_quantity_allocated
     FROM vendors v
     LEFT JOIN vendor_order_mapping vom ON v.id = vom.vendor_id
     LEFT JOIN orders o ON o.id = vom.order_id AND o.created_at BETWEEN $1 AND $2
     WHERE v.status = 'ACTIVE'
     GROUP BY v.id, v.name, v.status, v.monthly_capacity_max
     ORDER BY v.name ASC`,
    [monthStart, monthEnd]
  );

  return result.rows;
}
