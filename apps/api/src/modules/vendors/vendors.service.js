"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVendor = createVendor;
exports.getVendorById = getVendorById;
exports.getVendors = getVendors;
exports.updateVendor = updateVendor;
exports.createVendorAgreement = createVendorAgreement;
exports.getVendorAgreements = getVendorAgreements;
exports.getActiveVendorAgreement = getActiveVendorAgreement;
exports.recordVendorPerformance = recordVendorPerformance;
exports.getVendorPerformance = getVendorPerformance;
exports.createVendorPayment = createVendorPayment;
exports.getVendorPayments = getVendorPayments;
exports.updateVendorPaymentStatus = updateVendorPaymentStatus;
exports.assignOrderToVendor = assignOrderToVendor;
exports.getOrderVendorAssignments = getOrderVendorAssignments;
exports.getVendorActiveOrders = getVendorActiveOrders;
exports.updateOrderVendorSettlement = updateOrderVendorSettlement;
exports.getPendingVendorPayments = getPendingVendorPayments;
exports.getVendorCapacityUtilization = getVendorCapacityUtilization;
exports.getAllVendorsCapacityStatus = getAllVendorsCapacityStatus;
const database_1 = require("@packages/database");
const vendors_interface_1 = require("./vendors.interface");
// Vendor Management
async function createVendor(vendorData) {
    const { name, location, country, specialization, contact_email, contact_phone, primary_contact_name, monthly_capacity_min, monthly_capacity_max, price_per_unit_min, price_per_unit_max, lead_time_standard_days, lead_time_expedite_days, minimum_order_qty, status, tier, certifications, notes, } = vendorData;
    const result = await database_1.pool.query(`INSERT INTO vendors (
      name, location, country, specialization, contact_email, contact_phone,
      primary_contact_name, monthly_capacity_min, monthly_capacity_max,
      price_per_unit_min, price_per_unit_max, lead_time_standard_days,
      lead_time_expedite_days, minimum_order_qty, status, tier, certifications, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *`, [
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
        status || vendors_interface_1.VendorStatus.PROSPECT,
        tier,
        certifications,
        notes,
    ]);
    return result.rows[0];
}
async function getVendorById(id) {
    const result = await database_1.pool.query('SELECT * FROM vendors WHERE id = $1', [id]);
    return result.rows[0] || null;
}
async function getVendors(filters) {
    let query = 'SELECT * FROM vendors WHERE 1=1';
    const params = [];
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
    const result = await database_1.pool.query(query, params);
    return result.rows;
}
async function updateVendor(id, updates) {
    const fields = [];
    const values = [];
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
    const result = await database_1.pool.query(query, values);
    return result.rows[0];
}
// Vendor Agreements
async function createVendorAgreement(agreementData) {
    const { vendor_id, effective_date, expiry_date, payment_terms, currency, price_per_unit, minimum_order_qty, price_tier_volume_1, price_tier_volume_2, terms_conditions, } = agreementData;
    const result = await database_1.pool.query(`INSERT INTO vendor_agreements (
      vendor_id, effective_date, expiry_date, payment_terms, currency,
      price_per_unit, minimum_order_qty, price_tier_volume_1, price_tier_volume_2, terms_conditions
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`, [
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
    ]);
    return result.rows[0];
}
async function getVendorAgreements(vendorId) {
    const result = await database_1.pool.query('SELECT * FROM vendor_agreements WHERE vendor_id = $1 ORDER BY created_at DESC', [vendorId]);
    return result.rows;
}
async function getActiveVendorAgreement(vendorId) {
    const result = await database_1.pool.query(`SELECT * FROM vendor_agreements
     WHERE vendor_id = $1 AND status = 'ACTIVE'
     AND (expiry_date IS NULL OR expiry_date > NOW())
     ORDER BY created_at DESC LIMIT 1`, [vendorId]);
    return result.rows[0] || null;
}
// Vendor Performance Metrics
async function recordVendorPerformance(metric) {
    const result = await database_1.pool.query(`INSERT INTO vendor_performance_metrics (
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
    RETURNING *`, [
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
    ]);
    return result.rows[0];
}
async function getVendorPerformance(vendorId, monthsBack = 6) {
    const result = await database_1.pool.query(`SELECT * FROM vendor_performance_metrics
     WHERE vendor_id = $1 AND metric_month >= NOW() - INTERVAL '${monthsBack} months'
     ORDER BY metric_month DESC`, [vendorId]);
    return result.rows;
}
// Vendor Payments
async function createVendorPayment(paymentData) {
    const { vendor_id, payment_date, amount, currency, payment_method, reference, status, notes } = paymentData;
    const result = await database_1.pool.query(`INSERT INTO vendor_payments (
      vendor_id, payment_date, amount, currency, payment_method, reference, status, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`, [vendor_id, payment_date, amount, currency || 'USD', payment_method, reference, status || 'PENDING', notes]);
    return result.rows[0];
}
async function getVendorPayments(vendorId, filters) {
    let query = 'SELECT * FROM vendor_payments WHERE vendor_id = $1';
    const params = [vendorId];
    if (filters?.status) {
        query += ` AND status = $2`;
        params.push(filters.status);
    }
    query += ' ORDER BY payment_date DESC';
    const result = await database_1.pool.query(query, params);
    return result.rows;
}
async function updateVendorPaymentStatus(paymentId, status) {
    const result = await database_1.pool.query('UPDATE vendor_payments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, paymentId]);
    return result.rows[0];
}
// Vendor Order Mapping
async function assignOrderToVendor(orderId, vendorId, quantityAllocated, notes) {
    const result = await database_1.pool.query(`INSERT INTO vendor_order_mapping (order_id, vendor_id, quantity_allocated, notes)
     VALUES ($1, $2, $3, $4) RETURNING *`, [orderId, vendorId, quantityAllocated, notes]);
    // Also update the orders table with vendor_id
    await database_1.pool.query('UPDATE orders SET vendor_id = $1 WHERE id = $2', [vendorId, orderId]);
    return result.rows[0];
}
async function getOrderVendorAssignments(orderId) {
    const result = await database_1.pool.query('SELECT * FROM vendor_order_mapping WHERE order_id = $1 ORDER BY assigned_date DESC', [orderId]);
    return result.rows;
}
async function getVendorActiveOrders(vendorId) {
    const result = await database_1.pool.query(`SELECT o.*, vom.quantity_allocated
     FROM orders o
     JOIN vendor_order_mapping vom ON o.id = vom.order_id
     WHERE o.vendor_id = $1 AND o.status IN ('CREATED', 'IN_PRODUCTION', 'IN_TRANSIT')
     ORDER BY o.created_at DESC`, [vendorId]);
    return result.rows;
}
// Vendor Settlement
async function updateOrderVendorSettlement(orderId, settlementData) {
    const result = await database_1.pool.query(`UPDATE orders SET
      vendor_settlement_status = $1,
      vendor_invoice_id = $2,
      vendor_invoice_date = $3,
      vendor_payment_due_date = $4,
      vendor_paid_date = $5,
      vendor_payment_amount = $6,
      updated_at = NOW()
     WHERE id = $7 RETURNING *`, [
        settlementData.vendor_settlement_status,
        settlementData.vendor_invoice_id,
        settlementData.vendor_invoice_date,
        settlementData.vendor_payment_due_date,
        settlementData.vendor_paid_date,
        settlementData.vendor_payment_amount,
        orderId,
    ]);
    return result.rows[0];
}
async function getPendingVendorPayments() {
    const result = await database_1.pool.query(`SELECT o.*, v.name as vendor_name, v.contact_email
     FROM orders o
     JOIN vendors v ON o.vendor_id = v.id
     WHERE o.vendor_settlement_status IN ('PENDING', 'INVOICED')
     AND o.vendor_payment_due_date <= NOW()
     ORDER BY o.vendor_payment_due_date ASC`);
    return result.rows;
}
// Analytics
async function getVendorCapacityUtilization(vendorId, month) {
    const filterMonth = month || new Date();
    const monthStart = new Date(filterMonth.getFullYear(), filterMonth.getMonth(), 1);
    const monthEnd = new Date(filterMonth.getFullYear(), filterMonth.getMonth() + 1, 0);
    const result = await database_1.pool.query(`SELECT
      v.id, v.name, v.monthly_capacity_max,
      COUNT(o.id) as orders_count,
      SUM(vom.quantity_allocated) as total_quantity_allocated
     FROM vendors v
     LEFT JOIN vendor_order_mapping vom ON v.id = vom.vendor_id
     LEFT JOIN orders o ON o.id = vom.order_id AND o.created_at BETWEEN $1 AND $2
     WHERE v.id = $3
     GROUP BY v.id, v.name, v.monthly_capacity_max`, [monthStart, monthEnd, vendorId]);
    return result.rows[0] || null;
}
async function getAllVendorsCapacityStatus(month) {
    const filterMonth = month || new Date();
    const monthStart = new Date(filterMonth.getFullYear(), filterMonth.getMonth(), 1);
    const monthEnd = new Date(filterMonth.getFullYear(), filterMonth.getMonth() + 1, 0);
    const result = await database_1.pool.query(`SELECT
      v.id, v.name, v.status, v.monthly_capacity_max,
      COUNT(o.id) as orders_count,
      SUM(vom.quantity_allocated) as total_quantity_allocated
     FROM vendors v
     LEFT JOIN vendor_order_mapping vom ON v.id = vom.vendor_id
     LEFT JOIN orders o ON o.id = vom.order_id AND o.created_at BETWEEN $1 AND $2
     WHERE v.status = 'ACTIVE'
     GROUP BY v.id, v.name, v.status, v.monthly_capacity_max
     ORDER BY v.name ASC`, [monthStart, monthEnd]);
    return result.rows;
}
//# sourceMappingURL=vendors.service.js.map