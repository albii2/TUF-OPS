
import { pool } from '@packages/database';
import type { Pool, PoolClient } from 'pg';
import { STAGES } from '@packages/auth';
import { Order, OrderStatus } from './orders.interface';

type OpportunityForOrder = {
    id: number;
    organization_id: number;
    deal_type: string;
    stage: string;
    assigned_rep_id?: number;
    assigned_director_id?: number;
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

async function getOpportunityForOrder(opportunityId: number, db: Pool | PoolClient = pool): Promise<OpportunityForOrder | null> {
    const result = await db.query<OpportunityForOrder>(
        'SELECT id, organization_id, deal_type, stage, assigned_rep_id, assigned_director_id FROM opportunities WHERE id = $1 FOR UPDATE',
        [opportunityId]
    );
    return result.rows[0] || null;
}

function isUniqueViolation(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}

export async function createOrderFromOpportunity(opportunityId: number, options?: { errorOnDuplicate?: boolean }): Promise<Order> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const opportunity = await getOpportunityForOrder(opportunityId, client);
        if (!opportunity) {
            throw new Error('Opportunity not found');
        }

        if (opportunity.stage !== 'CLOSED_WON' && opportunity.stage !== STAGES.CLOSED_WON) {
            throw new Error('Only CLOSED_WON opportunities can be converted to orders');
        }

        const existingOrderResult = await client.query<Order>('SELECT * FROM orders WHERE opportunity_id = $1', [opportunityId]);
        if (existingOrderResult.rows.length > 0) {
            if (options?.errorOnDuplicate === false) {
                await client.query('COMMIT');
                return existingOrderResult.rows[0];
            }
            throw new Error('Order already exists for this opportunity');
        }

        const result = await client.query(
            'INSERT INTO orders (opportunity_id, organization_id, deal_type, status, assigned_rep_id, assigned_director_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [opportunity.id, opportunity.organization_id, opportunity.deal_type, OrderStatus.CREATED, opportunity.assigned_rep_id ?? null, opportunity.assigned_director_id ?? null]
        );

        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        if (isUniqueViolation(error)) {
            if (options?.errorOnDuplicate === false) {
                const existingOrder = await getOrderByOpportunityId(opportunityId);
                if (existingOrder) return existingOrder;
            }
            throw new Error('Order already exists for this opportunity');
        }
        throw error;
    } finally {
        client.release();
    }
}

export async function ensureOrderFromClosedWonOpportunity(opportunityId: number): Promise<Order> {
    return createOrderFromOpportunity(opportunityId, { errorOnDuplicate: false });
}

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
    const result = await pool.query(
        'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, id]
    );
    return result.rows[0];
}

export async function getOrdersByVendor(vendorId: number): Promise<Order[]> {
    const result = await pool.query(
        'SELECT * FROM orders WHERE vendor_id = $1 ORDER BY created_at DESC',
        [vendorId]
    );
    return result.rows;
}

export async function getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    const result = await pool.query(
        'SELECT * FROM orders WHERE status = $1 ORDER BY created_at DESC',
        [status]
    );
    return result.rows;
}
