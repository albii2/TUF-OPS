
import { pool } from '@packages/database';
import { OpportunityStage } from '../opportunities/opportunities.interface';
import { getOpportunityById } from '../opportunities/opportunities.service';
import { Order, OrderStatus } from './orders.interface';

export async function getOrderById(id: number): Promise<Order | null> {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0];
}

export async function getOrderByOpportunityId(opportunityId: number): Promise<Order | null> {
    const result = await pool.query('SELECT * FROM orders WHERE opportunity_id = $1', [opportunityId]);
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0];
}

export async function createOrderFromOpportunity(opportunityId: number): Promise<Order> {
    const opportunity = await getOpportunityById(opportunityId);
    if (!opportunity) {
        throw new Error('Opportunity not found');
    }

    if (opportunity.stage !== OpportunityStage.CLOSED_WON) {
        throw new Error('Only CLOSED_WON opportunities can be converted to orders');
    }

    const existingOrder = await getOrderByOpportunityId(opportunityId);
    if (existingOrder) {
        return existingOrder;
    }

    const result = await pool.query(
        'INSERT INTO orders (opportunity_id, organization_id, deal_type, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [opportunity.id, opportunity.organization_id, opportunity.deal_type, OrderStatus.CREATED]
    );

    return result.rows[0];
}
