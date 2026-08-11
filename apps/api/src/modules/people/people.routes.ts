import { FastifyInstance } from 'fastify';
import { listHandler, createHandler, advanceHandler, statsHandler } from './people.controller';

export async function peopleRoutes(server: FastifyInstance) {
  server.get('/', listHandler);
  server.get('/stats', statsHandler);
  server.post('/', createHandler);
  server.put('/:id/advance', advanceHandler);
}
