import { FastifyReply, FastifyRequest } from 'fastify';
import { changeOwnCredential, certifyUser, createUserWithTemporaryCredential, listUsers, loginWithCredential, resetUserCredential, setUserStatus, verifyAuthToken } from './users.service';
import type { SafeUser } from './users.interface';

function bearerToken(request: FastifyRequest) {
  const header = request.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice(7) : undefined;
}

async function requireAuthenticatedUser(request: FastifyRequest, reply: FastifyReply): Promise<SafeUser | null> {
  const token = bearerToken(request);
  const user = await verifyAuthToken(token);
  if (!user) {
    reply.code(401).send({ error: 'Authentication required' });
    return null;
  }
  return user;
}

function handleError(reply: FastifyReply, error: unknown) {
  const message = error instanceof Error ? error.message : 'Internal server error';
  if (message.includes('Only Owner') || message.includes('Only Director')) return reply.code(403).send({ error: message });
  if (message.includes('not found')) return reply.code(404).send({ error: message });
  if (message.includes('required')) return reply.code(400).send({ error: message });
  if (message.includes('invalid') || message.includes('Invalid')) return reply.code(400).send({ error: message });
  return reply.code(500).send({ error: message });
}

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await loginWithCredential(request.body as any);
    if (!result) return reply.code(401).send({ error: 'Invalid PIN' });
    return reply.send(result);
  } catch (error) {
    return handleError(reply, error);
  }
}

export async function getMeHandler(request: FastifyRequest, reply: FastifyReply) {
  const token = bearerToken(request);
  const user = await verifyAuthToken(token);
  if (!user) return reply.code(401).send({ error: 'Not authenticated' });
  return reply.send({ user });
}

export async function listUsersHandler(request: FastifyRequest, reply: FastifyReply) {
  const actor = await requireAuthenticatedUser(request, reply);
  if (!actor) return;
  try {
    const users = await listUsers(actor);
    return reply.send({ users });
  } catch (error) {
    return handleError(reply, error);
  }
}

export async function createUserHandler(request: FastifyRequest, reply: FastifyReply) {
  const actor = await requireAuthenticatedUser(request, reply);
  if (!actor) return;
  try {
    const result = await createUserWithTemporaryCredential(request.body as any, actor);
    return reply.code(201).send(result);
  } catch (error) {
    return handleError(reply, error);
  }
}

export async function resetCredentialHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const actor = await requireAuthenticatedUser(request, reply);
  if (!actor) return;
  try {
    const result = await resetUserCredential(Number(request.params.id), actor);
    return reply.send(result);
  } catch (error) {
    return handleError(reply, error);
  }
}

export async function changeCredentialHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = await requireAuthenticatedUser(request, reply);
  if (!user) return;
  try {
    const updated = await changeOwnCredential(user.id, request.body as any);
    return reply.send({ user: updated });
  } catch (error) {
    return handleError(reply, error);
  }
}

export async function certifyUserHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const actor = await requireAuthenticatedUser(request, reply);
  if (!actor) return;
  try {
    const user = await certifyUser(Number(request.params.id), actor);
    return reply.send({ user });
  } catch (error) {
    return handleError(reply, error);
  }
}

export async function setUserStatusHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const actor = await requireAuthenticatedUser(request, reply);
  if (!actor) return;
  try {
    await setUserStatus(Number(request.params.id), (request.body as any)?.status || 'INACTIVE', actor);
    return reply.send({ success: true });
  } catch (error) {
    return handleError(reply, error);
  }
}
