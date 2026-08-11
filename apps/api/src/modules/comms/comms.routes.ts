import { FastifyInstance } from 'fastify';
import { listHandler, getHandler, createHandler, updateHandler, deleteHandler, upcomingHandler } from './comms.controller';

export async function commsRoutes(server: FastifyInstance) {
  server.get('/', listHandler);
  server.get('/upcoming', upcomingHandler);
  server.get('/:id', getHandler);
  server.post('/', createHandler);
  server.put('/:id', updateHandler);
  server.delete('/:id', deleteHandler);
}
