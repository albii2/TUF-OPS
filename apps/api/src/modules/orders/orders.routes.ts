import { FastifyInstance } from 'fastify';
import { requireCertification } from '../../auth';
import { createOrderHandler, getOrderByIdHandler, getOrdersHandler } from './orders.controller';

export async function orderRoutes(server: FastifyInstance) {
  server.get('/', { preHandler: [requireCertification()] }, getOrdersHandler);
  server.post('/', { preHandler: [requireCertification()] }, createOrderHandler);
  server.get('/:id', { preHandler: [requireCertification()] }, getOrderByIdHandler);
}
