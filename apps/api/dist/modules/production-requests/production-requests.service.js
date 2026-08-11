"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductionRequest = createProductionRequest;
exports.updateProductionRequestStatus = updateProductionRequestStatus;
exports.getProductionRequestsByOpportunity = getProductionRequestsByOpportunity;
const database_1 = require("@packages/database");
const production_requests_interface_1 = require("./production-requests.interface");
const opportunities_service_1 = require("../opportunities/opportunities.service");
async function createProductionRequest(data) {
    const { opportunity_id, type, requested_by, title, description, assigned_to, external_url, sample_cost, sample_charge_to_customer, sample_waived_by_rep, waiver_reason, shipping_status, tracking_number } = data;
    if (!opportunity_id) {
        throw new Error('Opportunity ID is required');
    }
    const opportunity = await (0, opportunities_service_1.getOpportunityById)(opportunity_id);
    if (!opportunity) {
        throw new Error('Opportunity not found');
    }
    if (type === production_requests_interface_1.ProductionRequestType.SAMPLE) {
        const allowedTypes = ['UNIFORM', 'LETTERMAN'];
        if (opportunity.deal_type === null || opportunity.deal_type === undefined || !allowedTypes.includes(opportunity.deal_type)) {
            throw new Error(`Sample requests not allowed for deal type: ${opportunity.deal_type}`);
        }
        if (sample_waived_by_rep && !waiver_reason) {
            throw new Error('Waiver reason is required for waived samples');
        }
    }
    const result = await database_1.pool.query('INSERT INTO production_requests (opportunity_id, type, status, requested_by, title, description, assigned_to, external_url, sample_cost, sample_charge_to_customer, sample_waived_by_rep, waiver_reason, shipping_status, tracking_number) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *', [opportunity_id, type, production_requests_interface_1.ProductionRequestStatus.REQUESTED, requested_by, title, description, assigned_to, external_url, sample_cost, sample_charge_to_customer ?? true, sample_waived_by_rep ?? false, waiver_reason, shipping_status, tracking_number]);
    return result.rows[0];
}
async function updateProductionRequestStatus(id, status) {
    const result = await database_1.pool.query('UPDATE production_requests SET status = $1, updated_at = current_timestamp WHERE id = $2 RETURNING *', [status, id]);
    return result.rows[0];
}
async function getProductionRequestsByOpportunity(opportunityId) {
    const result = await database_1.pool.query('SELECT * FROM production_requests WHERE opportunity_id = $1 ORDER BY created_at DESC', [opportunityId]);
    return result.rows;
}
//# sourceMappingURL=production-requests.service.js.map