
import { FastifyRequest, FastifyReply } from 'fastify';
import {
    createOrderFromOpportunity,
    getOrders,
    getOrderById,
} from './orders.service';

export async function createOrderHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { opportunityId } = request.body as { opportunityId: number };
        if (!opportunityId) {
            return reply.code(400).send({ message: 'opportunityId is required' });
        }
        const order = await createOrderFromOpportunity(Number(opportunityId));
        return reply.code(201).send(order);
    } catch (error: any) {
        return reply.code(400).send({ message: error.message });
    }
}

export async function getOrdersHandler(request: FastifyRequest, reply: FastifyReply) {
    const orders = await getOrders();
    return reply.send(orders);
}

export async function getOrderByIdHandler(request: FastifyRequest, reply: FastifyReply) {
    try {
        const { id } = request.params as { id: string };
        const order = await getOrderById(Number(id));
        if (!order) {
            return reply.code(404).send({ message: 'Order not found' });
        }
        return reply.send(order);
    } catch (error: any) {
        return reply.code(400).send({ message: error.message });
    }
}
