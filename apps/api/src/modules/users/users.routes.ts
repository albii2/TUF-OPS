import { FastifyInstance } from 'fastify';
import { permissions, requirePermission } from '../../auth';
import { certifyUserHandler, changeCredentialHandler, createUserHandler, getMeHandler, listUsersHandler, loginHandler, resetCredentialHandler } from './users.controller';

export async function userRoutes(server: FastifyInstance) {
  server.post('/login', loginHandler);
  server.get('/me', getMeHandler);
  server.get('/users', listUsersHandler);
  server.post('/users', createUserHandler);
  server.post('/users/:id/reset-credential', resetCredentialHandler);
  server.post('/users/me/change-credential', changeCredentialHandler);
  server.put('/users/:id/certify', { preHandler: requirePermission(permissions.INVITE_USER) }, certifyUserHandler as any);
}
