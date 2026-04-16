import { FastifyRequest, FastifyReply } from 'fastify';
import { createOrganization, getOrganizations } from './organizations.service';

export async function createOrganizationHandler(request: FastifyRequest, reply: FastifyReply) {
  const organization = await createOrganization(request.body as any);
  return reply.code(201).send(organization);
}

export async function getOrganizationsHandler(request: FastifyRequest, reply: FastifyReply) {
  const organizations = await getOrganizations();
  return reply.send(organizations);
}
