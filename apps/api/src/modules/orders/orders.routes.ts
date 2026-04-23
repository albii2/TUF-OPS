import { FastifyInstance } from 'fastify';
import {
  createOrderFromOpportunityHandler,
  getOrderByIdHandler,
  getOrderByOpportunityIdHandler,
} from './orders.controller';

export async function orderRoutes(server: FastifyInstance) {
  server.post('/from-opportunity/:opportunityId', createOrderFromOpportunityHandler);
  server.get('/opportunity/:opportunityId', getOrderByOpportunityIdHandler);
  server.get('/:id', getOrderByIdHandler);
}
