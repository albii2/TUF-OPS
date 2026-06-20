"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderById = getOrderById;
exports.getOrderByOpportunityId = getOrderByOpportunityId;
exports.getOrders = getOrders;
exports.createOrderFromOpportunity = createOrderFromOpportunity;
exports.ensureOrderFromClosedWonOpportunity = ensureOrderFromClosedWonOpportunity;
exports.updateOrderStatus = updateOrderStatus;
exports.getOrdersByVendor = getOrdersByVendor;
exports.getOrdersByStatus = getOrdersByStatus;
const database_1 = require("@packages/database");
const opportunities_interface_1 = require("../opportunities/opportunities.interface");
const orders_interface_1 = require("./orders.interface");
async function getOrderById(id) {
    const result = await database_1.pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0];
}
async function getOrderByOpportunityId(opportunityId) {
    const result = await database_1.pool.query('SELECT * FROM orders WHERE opportunity_id = $1', [opportunityId]);
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0];
}
async function getOrders() {
    const result = await database_1.pool.query('SELECT * FROM orders ORDER BY created_at DESC, id DESC');
    return result.rows;
}
async function getOpportunityForOrder(opportunityId, db = database_1.pool) {
    const result = await db.query('SELECT id, organization_id, deal_type, stage, assigned_rep_id, assigned_director_id FROM opportunities WHERE id = $1 FOR UPDATE', [opportunityId]);
    return result.rows[0] || null;
}
function isUniqueViolation(error) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}
async function createOrderFromOpportunity(opportunityId, options) {
    const client = await database_1.pool.connect();
    try {
        await client.query('BEGIN');
        const opportunity = await getOpportunityForOrder(opportunityId, client);
        if (!opportunity) {
            throw new Error('Opportunity not found');
        }
        if (opportunity.stage !== opportunities_interface_1.OpportunityStage.CLOSED_WON) {
            throw new Error('Only CLOSED_WON opportunities can be converted to orders');
        }
        const existingOrderResult = await client.query('SELECT * FROM orders WHERE opportunity_id = $1', [opportunityId]);
        if (existingOrderResult.rows.length > 0) {
            if (options?.errorOnDuplicate === false) {
                await client.query('COMMIT');
                return existingOrderResult.rows[0];
            }
            throw new Error('Order already exists for this opportunity');
        }
        const result = await client.query('INSERT INTO orders (opportunity_id, organization_id, deal_type, status, assigned_rep_id, assigned_director_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [opportunity.id, opportunity.organization_id, opportunity.deal_type, orders_interface_1.OrderStatus.CREATED, opportunity.assigned_rep_id ?? null, opportunity.assigned_director_id ?? null]);
        await client.query('COMMIT');
        return result.rows[0];
    }
    catch (error) {
        await client.query('ROLLBACK');
        if (isUniqueViolation(error)) {
            if (options?.errorOnDuplicate === false) {
                const existingOrder = await getOrderByOpportunityId(opportunityId);
                if (existingOrder)
                    return existingOrder;
            }
            throw new Error('Order already exists for this opportunity');
        }
        throw error;
    }
    finally {
        client.release();
    }
}
async function ensureOrderFromClosedWonOpportunity(opportunityId) {
    return createOrderFromOpportunity(opportunityId, { errorOnDuplicate: false });
}
async function updateOrderStatus(id, status) {
    const result = await database_1.pool.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, id]);
    return result.rows[0];
}
async function getOrdersByVendor(vendorId) {
    const result = await database_1.pool.query('SELECT * FROM orders WHERE vendor_id = $1 ORDER BY created_at DESC', [vendorId]);
    return result.rows;
}
async function getOrdersByStatus(status) {
    const result = await database_1.pool.query('SELECT * FROM orders WHERE status = $1 ORDER BY created_at DESC', [status]);
    return result.rows;
}
//# sourceMappingURL=orders.service.js.map