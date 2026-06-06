import { FastifyRequest, FastifyReply } from 'fastify';
import type { Opportunity } from './opportunities.interface';
import { createOpportunity, getOpportunities, getOpportunitiesByOrganization, updateOpportunityStage, updateOpportunity } from './opportunities.service';
import { Opportunity } from './opportunities.interface';

export async function createOpportunityHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const opportunity = await createOpportunity(request.body as any);
    return reply.code(201).send(opportunity);
  } catch (error: any) {
    if (error.message.includes('already exists') || error.message.includes('channel_type is required')) {
      return reply.code(400).send({ message: error.message });
    }
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function getOpportunitiesByOrganizationHandler(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.params as any;
  const opportunities = await getOpportunitiesByOrganization(organizationId);
  return reply.send(opportunities);
}

export async function getOpportunitiesHandler(request: FastifyRequest, reply: FastifyReply) {
  const opportunities = await getOpportunities();
  return reply.send(opportunities);
}

export async function updateOpportunityStageHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const { stage, changed_by, note, actual_revenue, actual_cost, loss_reason } = request.body as any;

  try {
    const updatedOpportunity = await updateOpportunityStage(Number(id), stage, changed_by, note, { actual_revenue, actual_cost, loss_reason });
    return reply.send(updatedOpportunity);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return reply.code(404).send({ message: error.message });
    }
    if (error.message.includes('Invalid stage transition') || error.message.includes('required to close an opportunity')) {
      return reply.code(400).send({ message: error.message });
    }
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

export async function updateOpportunityHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  try {
    const updatedOpportunity = await updateOpportunity(Number(id), request.body as Partial<Opportunity>);
    return reply.send(updatedOpportunity);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return reply.code(404).send({ message: error.message });
    }
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}
