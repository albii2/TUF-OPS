
import { pool } from '@packages/database';
import { OpportunityStage } from '../opportunities/opportunities.interface';
import { Order, OrderStatus } from './orders.interface';

type OpportunityForOrder = {
    id: number;
    organization_id: number;
    deal_type: string;
    stage: OpportunityStage;
};

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

export async function getOrders(): Promise<Order[]> {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC, id DESC');
    return result.rows;
}

async function getOpportunityForOrder(opportunityId: number): Promise<OpportunityForOrder | null> {
    const result = await pool.query<OpportunityForOrder>(
        'SELECT id, organization_id, deal_type, stage FROM opportunities WHERE id = $1',
        [opportunityId]
    );
    return result.rows[0] || null;
}

export async function createOrderFromOpportunity(opportunityId: number, options?: { errorOnDuplicate?: boolean }): Promise<Order> {
    const opportunity = await getOpportunityForOrder(opportunityId);
    if (!opportunity) {
        throw new Error('Opportunity not found');
    }

    if (opportunity.stage !== OpportunityStage.CLOSED_WON) {
        throw new Error('Only CLOSED_WON opportunities can be converted to orders');
    }

    const existingOrder = await getOrderByOpportunityId(opportunityId);
    if (existingOrder) {
        if (options?.errorOnDuplicate === false) {
            return existingOrder;
        }
        throw new Error('Order already exists for this opportunity');
    }

    const result = await pool.query(
        'INSERT INTO orders (opportunity_id, organization_id, deal_type, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [opportunity.id, opportunity.organization_id, opportunity.deal_type, OrderStatus.CREATED]
    );

    return result.rows[0];
}

export async function ensureOrderFromClosedWonOpportunity(opportunityId: number): Promise<Order> {
    return createOrderFromOpportunity(opportunityId, { errorOnDuplicate: false });
}
