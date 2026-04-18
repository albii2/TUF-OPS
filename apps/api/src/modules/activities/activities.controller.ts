import { FastifyRequest, FastifyReply } from 'fastify';
import { createActivity, getActivitiesByOpportunity, getActivitiesByOrganization, markActivityComplete } from './activities.service';
import { ActivityType } from './activities.interface';

export async function createActivityHandler(request: FastifyRequest, reply: FastifyReply) {
  const { type, organization_id, opportunity_id, description, created_by, due_date, completed } = request.body as any;
  if (!Object.values(ActivityType).includes(type)) {
    return reply.code(400).send({ message: 'Invalid activity type' });
  }
  const activity = await createActivity({ type, organization_id, opportunity_id, description, created_by, due_date, completed });
  return reply.code(201).send(activity);
}

export async function getActivitiesByOpportunityHandler(request: FastifyRequest, reply: FastifyReply) {
  const { opportunityId } = request.params as any;
  const activities = await getActivitiesByOpportunity(Number(opportunityId));
  return reply.send(activities);
}

export async function getActivitiesByOrganizationHandler(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.params as any;
  const activities = await getActivitiesByOrganization(Number(organizationId));
  return reply.send(activities);
}

export async function markActivityCompleteHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const { completedBy } = request.body as any; // Assuming completedBy is passed in body
  try {
    const updatedActivity = await markActivityComplete(Number(id), completedBy);
    return reply.send(updatedActivity);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return reply.code(404).send({ message: error.message });
    }
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}
