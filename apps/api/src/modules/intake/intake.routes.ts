import { FastifyInstance } from 'fastify';
import { listHandler, getHandler, createHandler, updateHandler, deleteHandler, decisionsHandler } from './intake.controller';

export async function intakeRoutes(server: FastifyInstance) {
  // GET /api/intake — list all
  server.get('/', listHandler);
  // GET /api/intake/decisions — open critical/high decisions
  server.get('/decisions', decisionsHandler);
  // GET /api/intake/:id — single item
  server.get('/:id', getHandler);
  // POST /api/intake — create
  server.post('/', createHandler);
  // PUT /api/intake/:id — update
  server.put('/:id', updateHandler);
  // DELETE /api/intake/:id — delete
  server.delete('/:id', deleteHandler);
}
