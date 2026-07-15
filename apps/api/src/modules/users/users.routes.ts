import { FastifyInstance } from 'fastify';
import { permissions, requirePermission } from '../../auth';
import { certifyUserHandler, changeCredentialHandler, createUserHandler, getMeHandler, listUsersHandler, loginHandler, resetCredentialHandler, setUserStatusHandler, updateUserHandler } from './users.controller';

export async function userRoutes(server: FastifyInstance) {
  // Auth endpoints (no preHandler — handled inline by authMiddleware+controller)
  server.post('/login', loginHandler);
  server.get('/me', getMeHandler);
  server.post('/users/me/change-credential', changeCredentialHandler);

  // Admin-only user management
  server.get('/users', listUsersHandler);
  server.post('/users', { preHandler: requirePermission(permissions.INVITE_USER) }, createUserHandler);
  server.post('/users/:id/reset-credential', { preHandler: requirePermission(permissions.INVITE_USER) }, resetCredentialHandler as any);
  server.put('/users/:id/certify', { preHandler: requirePermission(permissions.INVITE_USER) }, certifyUserHandler as any);
  server.put('/users/:id/status', { preHandler: requirePermission(permissions.INVITE_USER) }, setUserStatusHandler as any);
  server.put('/users/:id', updateUserHandler);
}
