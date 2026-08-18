import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../auth';
import { listResourcesHandler, getResourceHandler } from './academy-resources.controller';

export async function academyResourcesRoutes(server: FastifyInstance) {
  // Any authenticated user (reps included) can read Academy resources
  server.addHook('onRequest', async (request, reply) => {
    await authMiddleware(request);
    if (!request.currentUser) {
      return reply.code(401).send({ error: 'Authentication required' });
    }
  });

  server.get('/', listResourcesHandler);
  server.get('/:slug', getResourceHandler);
}
