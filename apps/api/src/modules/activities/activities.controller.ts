import { FastifyRequest, FastifyReply } from 'fastify';
import { createActivity, getActivitiesByOpportunity, getActivitiesByOrganization, markActivityComplete, createRepActivity, getRepActivitiesByOpportunity } from './activities.service';
import { ActivityType } from './activities.interface';

export async function createActivityHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as any;

  // Accept both camelCase (frontend) and snake_case (backend) field names
  const type = body.type || body.activity_type;
  const organization_id = body.organization_id ?? body.organizationId;
  const opportunity_id = body.opportunity_id ?? body.opportunityId;
  const description = body.description || body.notes;
  const created_by = body.created_by ?? body.createdBy;
  const due_date = body.due_date ?? body.dueDate;
  const completed = body.completed;

  if (!type) {
    return reply.code(400).send({ message: 'Activity type is required' });
  }

  if (!Object.values(ActivityType).includes(type)) {
    return reply.code(400).send({ message: 'Invalid activity type' });
  }

  const activity = await createActivity({
    type,
    organization_id,
    opportunity_id,
    description,
    created_by,
    due_date,
    completed,
  });
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

// RepActivity handlers (prospecting activity logging)
export async function createRepActivityHandler(request: FastifyRequest, reply: FastifyReply) {
  const currentUser = request.currentUser;
  if (!currentUser?.id) {
    return reply.code(401).send({ message: 'Authentication required' });
  }

  const { opportunity_id, activity_type, notes } = request.body as any;

  if (!opportunity_id) {
    return reply.code(400).send({ message: 'opportunity_id is required' });
  }
  if (!activity_type) {
    return reply.code(400).send({ message: 'activity_type is required' });
  }

  try {
    const activity = await createRepActivity({
      user_id: currentUser.id,
      opportunity_id,
      activity_type,
      notes,
    });
    return reply.code(201).send(activity);
  } catch (error: any) {
    if (error.message.includes('Invalid activity_type')) {
      return reply.code(400).send({ message: error.message });
    }
    if (error.message.includes('required')) {
      return reply.code(400).send({ message: error.message });
    }
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function getRepActivitiesByOpportunityHandler(request: FastifyRequest, reply: FastifyReply) {
  const { opportunity_id } = request.query as any;

  if (!opportunity_id) {
    return reply.code(400).send({ message: 'opportunity_id query parameter is required' });
  }

  const activities = await getRepActivitiesByOpportunity(Number(opportunity_id));
  return reply.send(activities);
}
