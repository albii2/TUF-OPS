
import { FastifyRequest, FastifyReply } from 'fastify';
import {
    createOrderFromOpportunity,
    getOrderById,
    getOrderByOpportunityId,
} from './orders.service';

export async function createOrderFromOpportunityHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { opportunityId } = request.params as { opportunityId: string };
        const order = await createOrderFromOpportunity(Number(opportunityId));
        reply.code(201).send(order);
    } catch (error: any) {
        reply.code(400).send({ error: error.message });
    }
}

export async function getOrderByIdHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { id } = request.params as { id: string };
        const order = await getOrderById(Number(id));
        if (!order) {
            return reply.code(404).send({ error: 'Order not found' });
        }
        reply.send(order);
    } catch (error: any) {
        reply.code(400).send({ error: error.message });
    }
}

export async function getOrderByOpportunityIdHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { opportunityId } = request.params as { opportunityId: string };
        const order = await getOrderByOpportunityId(Number(opportunityId));
        if (!order) {
            return reply.code(404).send({ error: 'Order not found for this opportunity' });
        }
        reply.send(order);
    } catch (error: any) {
        reply.code(400).send({ error: error.message });
    }
}
