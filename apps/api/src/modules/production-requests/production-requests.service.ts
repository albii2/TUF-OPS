
import { pool } from '@packages/database';
import { ProductionRequest, ProductionRequestStatus, ProductionRequestType } from './production-requests.interface';
import { getOpportunityById } from '../opportunities/opportunities.service';

export async function createProductionRequest(data: Partial<ProductionRequest>): Promise<ProductionRequest> {
    const { opportunity_id, type, requested_by, title, description, assigned_to, external_url, sample_cost, sample_charge_to_customer, sample_waived_by_rep, waiver_reason, shipping_status, tracking_number } = data;

    if (!opportunity_id) {
        throw new Error('Opportunity ID is required');
    }

    const opportunity = await getOpportunityById(opportunity_id);
    if (!opportunity) {
        throw new Error('Opportunity not found');
    }

    if (type === ProductionRequestType.SAMPLE) {
        const allowedTypes = ['UNIFORM', 'LETTERMAN'];

        if (opportunity.deal_type === null || opportunity.deal_type === undefined || !allowedTypes.includes(opportunity.deal_type)) {
            throw new Error(`Sample requests not allowed for deal type: ${opportunity.deal_type}`);
        }

        if (sample_waived_by_rep && !waiver_reason) {
            throw new Error('Waiver reason is required for waived samples');
        }
    }

    const result = await pool.query(
        'INSERT INTO production_requests (opportunity_id, type, status, requested_by, title, description, assigned_to, external_url, sample_cost, sample_charge_to_customer, sample_waived_by_rep, waiver_reason, shipping_status, tracking_number) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
        [opportunity_id, type, ProductionRequestStatus.REQUESTED, requested_by, title, description, assigned_to, external_url, sample_cost, sample_charge_to_customer ?? true, sample_waived_by_rep ?? false, waiver_reason, shipping_status, tracking_number]
    );

    return result.rows[0];
}

export async function updateProductionRequestStatus(id: number, status: ProductionRequestStatus): Promise<ProductionRequest> {
    const result = await pool.query(
        'UPDATE production_requests SET status = $1, updated_at = current_timestamp WHERE id = $2 RETURNING *',
        [status, id]
    );

    return result.rows[0];
}

export async function getProductionRequestsByOpportunity(opportunityId: number): Promise<ProductionRequest[]> {
    const result = await pool.query(
        'SELECT * FROM production_requests WHERE opportunity_id = $1 ORDER BY created_at DESC',
        [opportunityId]
    );

    return result.rows;
}
