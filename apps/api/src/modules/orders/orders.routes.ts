import { FastifyInstance } from 'fastify';
import { createOrderHandler, getOrderByIdHandler, getOrdersHandler } from './orders.controller';

export async function orderRoutes(server: FastifyInstance) {
  server.get('/', getOrdersHandler);
  server.post('/', createOrderHandler);
  server.get('/:id', getOrderByIdHandler);
}
