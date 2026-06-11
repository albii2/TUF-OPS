import { FastifyRequest, FastifyReply } from 'fastify';
import { createOrganization, getOrganizations, getOrganizationById, updateOrganization, deleteOrganization } from './organizations.service';

export async function createOrganizationHandler(request: FastifyRequest, reply: FastifyReply) {
  console.log('createOrganizationHandler called with body:', request.body);
  try {
    const organization = await createOrganization(request.body as any);
    return reply.code(201).send(organization);
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.message?.includes('required')) {
      return reply.code(409).send({ message: error.message });
    }
    return reply.code(500).send({ message: 'Error creating organization' });
  }
}

export async function getOrganizationsHandler(request: FastifyRequest, reply: FastifyReply) {
  const organizations = await getOrganizations();
  return reply.send(organizations);
}

export async function getOrganizationByIdHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const organization = await getOrganizationById(id);

  if (!organization) {
    return reply.code(404).send({ message: 'Organization not found' });
  }

  return reply.send(organization);
}

export async function updateOrganizationHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  try {
    const organization = await updateOrganization(id, request.body as any);
    return reply.send(organization);
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.message?.includes('required')) {
      return reply.code(409).send({ message: error.message });
    }
    return reply.code(500).send({ message: 'Error updating organization' });
  }
}

export async function deleteOrganizationHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  await deleteOrganization(id);
  return reply.code(204).send();
}
