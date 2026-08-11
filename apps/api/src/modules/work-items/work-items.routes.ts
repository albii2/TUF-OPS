import { FastifyInstance } from 'fastify';
import { requireCertification } from '../../auth';
import {
  listWorkItemsHandler,
  createWorkItemHandler,
  updateWorkItemHandler,
  updateWorkItemStatusHandler,
} from './work-items.controller';

export async function workItemsRoutes(server: FastifyInstance) {
  const pre = [requireCertification()];

  server.get('/', { preHandler: pre }, listWorkItemsHandler);
  server.post('/', { preHandler: pre }, createWorkItemHandler);
  server.put('/:id', { preHandler: pre }, updateWorkItemHandler);
  server.patch('/:id/status', { preHandler: pre }, updateWorkItemStatusHandler);
}
