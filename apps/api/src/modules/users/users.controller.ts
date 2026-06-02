import { FastifyReply, FastifyRequest } from 'fastify';
import { changeOwnCredential, createUserWithTemporaryCredential, getSafeUserById, listUsers, loginWithCredential, resetUserCredential } from './users.service';

function headerUserId(request: FastifyRequest) {
  const raw = request.headers['x-user-id'];
  return Number(Array.isArray(raw) ? raw[0] : raw);
}

function handleError(reply: FastifyReply, error: any) {
  const message = error?.message || 'Request failed';
  const status = message.includes('Only Owner/Admin') ? 403 : message.includes('not found') ? 404 : 400;
  return reply.code(status).send({ error: message });
}

export async function listUsersHandler(_: FastifyRequest, reply: FastifyReply) {
  return reply.send({ users: await listUsers() });
}

export async function getMeHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = await getSafeUserById(headerUserId(request));
  if (!user) return reply.code(404).send({ error: 'User not found' });
  return reply.send({ user });
}

export async function createUserHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await createUserWithTemporaryCredential(request.body as any, headerUserId(request));
    return reply.code(201).send(result);
  } catch (error) {
    return handleError(reply, error);
  }
}

export async function resetCredentialHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const result = await resetUserCredential(Number(request.params.id), headerUserId(request), (request.body as any)?.temporary_credential);
    return reply.send(result);
  } catch (error) {
    return handleError(reply, error);
  }
}

export async function changeCredentialHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = await changeOwnCredential(headerUserId(request), request.body as any);
    return reply.send({ user });
  } catch (error) {
    return handleError(reply, error);
  }
}

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = await loginWithCredential(request.body as any);
  if (!user) return reply.code(401).send({ error: 'Invalid credentials' });
  return reply.send({ user });
}
