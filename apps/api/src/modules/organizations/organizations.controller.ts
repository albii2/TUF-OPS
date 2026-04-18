import { FastifyRequest, FastifyReply } from 'fastify';
import { createOrganization, getOrganizations, updateOrganization, deleteOrganization } from './organizations.service';

export async function createOrganizationHandler(request: FastifyRequest, reply: FastifyReply) {
  const organization = await createOrganization(request.body as any);
  return reply.code(201).send(organization);
}

export async function getOrganizationsHandler(request: FastifyRequest, reply: FastifyReply) {
  const organizations = await getOrganizations();
  return reply.send(organizations);
}

export async function updateOrganizationHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const organization = await updateOrganization(id, request.body as any);
  return reply.send(organization);
}

export async function deleteOrganizationHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  await deleteOrganization(id);
  return reply.code(204).send();
}
