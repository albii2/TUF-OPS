"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderById = getOrderById;
exports.getOrderByOpportunityId = getOrderByOpportunityId;
exports.createOrderFromOpportunity = createOrderFromOpportunity;
const database_1 = require("@packages/database");
const opportunities_interface_1 = require("../opportunities/opportunities.interface");
const opportunities_service_1 = require("../opportunities/opportunities.service");
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
async function createOrderFromOpportunity(opportunityId) {
    const opportunity = await (0, opportunities_service_1.getOpportunityById)(opportunityId);
    if (!opportunity) {
        throw new Error('Opportunity not found');
    }
    if (opportunity.stage !== opportunities_interface_1.OpportunityStage.CLOSED_WON) {
        throw new Error('Only CLOSED_WON opportunities can be converted to orders');
    }
    const existingOrder = await getOrderByOpportunityId(opportunityId);
    if (existingOrder) {
        throw new Error('Order already exists for this opportunity');
    }
    const result = await database_1.pool.query('INSERT INTO orders (opportunity_id, organization_id, deal_type, status) VALUES ($1, $2, $3, $4) RETURNING *', [opportunity.id, opportunity.organization_id, opportunity.deal_type, orders_interface_1.OrderStatus.CREATED]);
    return result.rows[0];
}
//# sourceMappingURL=orders.service.js.map