import { FastifyReply, FastifyRequest } from 'fastify';
import { changeOwnCredential, createUserWithTemporaryCredential, listUsers, loginWithCredential, resetUserCredential, verifyAuthToken } from './users.service';
import type { SafeUser } from './users.interface';

function bearerToken(request: FastifyRequest) {
  const raw = request.headers.authorization;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const [scheme, token] = (value || '').split(' ');
  return scheme?.toLowerCase() === 'bearer' ? token : undefined;
}

async function authenticatedUser(request: FastifyRequest): Promise<SafeUser | null> {
  return verifyAuthToken(bearerToken(request));
}

async function requireAuthenticatedUser(request: FastifyRequest, reply: FastifyReply): Promise<SafeUser | null> {
  const user = await authenticatedUser(request);
  if (!user) {
    reply.code(401).send({ error: 'Authentication required' });
    return null;
  }
  return user;
}

function handleError(reply: FastifyReply, error: any) {
  const message = error?.message || 'Request failed';
  const status = message.includes('Only Owner/Admin') ? 403 : message.includes('not found') ? 404 : 400;
  return reply.code(status).send({ error: message });
}

export async function listUsersHandler(request: FastifyRequest, reply: FastifyReply) {
  const actor = await requireAuthenticatedUser(request, reply);
  if (!actor) return;
  try {
    return reply.send({ users: await listUsers(actor) });
  } catch (error) {
    return handleError(reply, error);
  }
}

export async function getMeHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = await requireAuthenticatedUser(request, reply);
  if (!user) return;
  return reply.send({ user });
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
    const result = await resetUserCredential(Number(request.params.id), actor, (request.body as any)?.temporary_credential);
    return reply.send(result);
  } catch (error) {
    return handleError(reply, error);
  }
}

export async function changeCredentialHandler(request: FastifyRequest, reply: FastifyReply) {
  const actor = await requireAuthenticatedUser(request, reply);
  if (!actor) return;
  try {
    const user = await changeOwnCredential(actor.id, request.body as any);
    return reply.send({ user });
  } catch (error) {
    return handleError(reply, error);
  }
}

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const result = await loginWithCredential(request.body as any);
  if (!result) return reply.code(401).send({ error: 'Invalid credentials' });
  return reply.send(result);
}
