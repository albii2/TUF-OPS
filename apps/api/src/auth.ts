import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import { getPermissions, hasPermission, permissions, PermissionDenied, type Permission } from '@packages/auth';
import { verifyAuthToken } from './modules/users/users.service';
import type { SafeUser } from './modules/users/users.interface';

declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: SafeUser | null;
    currentPermissions?: Set<Permission>;
  }
}

export async function authMiddleware(request: FastifyRequest) {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : undefined;
  const user = await verifyAuthToken(token);
  request.currentUser = user;
  request.currentPermissions = getPermissions(user?.role);
}

export function permissionErrorHandler(error: unknown, reply: FastifyReply) {
  if (error instanceof PermissionDenied || (error as { statusCode?: number })?.statusCode === 403) {
    return reply.code(403).send({ error: error instanceof Error ? error.message : 'Permission denied' });
  }
  throw error;
}

export function requirePermission(permission: Permission): preHandlerHookHandler {
  return (request, reply, done) => {
    if (process.env.ROLE_BASED_PERMISSIONS_ENABLED === 'false') return done();
    if (!request.currentUser) {
      reply.code(401).send({ error: 'Authentication required' });
      return;
    }
    if (!hasPermission(request.currentUser.role, permission)) {
      done(new PermissionDenied(`Permission '${permission}' required. Your role '${request.currentUser.role}' does not have it.`));
      return;
    }
    done();
  };
}

export { permissions };
