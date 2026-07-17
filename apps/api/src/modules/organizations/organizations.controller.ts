import { FastifyRequest, FastifyReply } from 'fastify';
import { createOrganization, getOrganizations, getOrganizationById, updateOrganization, deleteOrganization } from './organizations.service';

export async function createOrganizationHandler(request: FastifyRequest, reply: FastifyReply) {
  console.log('createOrganizationHandler called with body:', request.body);
  try {
    // Inject authenticated user as created_by/updated_by if not provided
    const body = request.body as any;
    if (!body.name?.trim()) {
      return reply.code(400).send({ message: 'Organization name is required' });
    }
    const actorId = (request as any).currentUser?.id;
    console.log('createOrganizationHandler actorId:', actorId, 'hasUser:', !!(request as any).currentUser);
    if (actorId && !body.created_by) body.created_by = actorId;
    if (actorId && !body.updated_by) body.updated_by = actorId;
    const organization = await createOrganization(body);
    return reply.code(201).send(organization);
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.message?.includes('required')) {
      return reply.code(409).send({ message: error.message });
    }
    console.error('createOrganization error:', error);
    return reply.code(500).send({ message: 'Error creating organization', detail: error?.message || String(error), code: error?.code });
  }
}

export async function getOrganizationsHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).currentUser;
  const organizations = await getOrganizations();
  
  // Territory scoping: directors with a state_market set only see orgs in their state
  if (user?.state_market && user.role !== 'ADMIN') {
    const state = user.state_market; // e.g. 'IL', 'MN', 'WI'
    const filtered = organizations.filter((org: any) => org.state === state || org.state_market === state);
    return reply.send(filtered);
  }
  
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
    console.error('updateOrganization error:', error);
    return reply.code(500).send({ message: error.message || 'Error updating organization' });
  }
}

export async function deleteOrganizationHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const userId = request.currentUser?.id ?? null;
  await deleteOrganization(id, userId);
  return reply.code(204).send();
}
