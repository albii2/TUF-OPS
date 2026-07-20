import { FastifyRequest, FastifyReply } from 'fastify';
import type { Opportunity } from './opportunities.interface';
import { createOpportunity, getOpportunities, getOpportunitiesByOrganization, updateOpportunityStage, updateOpportunity } from './opportunities.service';

export async function createOpportunityHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = request.body as any;
    if (!body.name?.trim()) {
      return reply.code(400).send({ message: 'Opportunity name is required' });
    }
    if (!body.organization_id && !body.organizationId) {
      return reply.code(400).send({ message: 'organization_id is required' });
    }
    // Inject auth user as created_by/updated_by if not provided
    const currentUser = (request as any).currentUser;
    if (currentUser?.id) {
      if (!body.created_by && !body.createdBy) body.created_by = currentUser.id;
      if (!body.updated_by && !body.updatedBy) body.updated_by = currentUser.id;
      // Auto-assign rep if the creator is a REP and no rep assigned
      if ((currentUser.role === 'REP' || currentUser.role === 'TAE') && !body.assignedRep && !body.assigned_rep_id) {
        body.assigned_rep_id = currentUser.id;
      }
    }
    const opportunity = await createOpportunity(body);
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
  const user = (request as any).currentUser;
  const query = (request.query as any) || {};
  const opportunities = await getOpportunities();
  
  // Apply stage filter if provided
  let filtered = opportunities;
  if (query.stage && query.stage !== 'ALL') {
    filtered = filtered.filter((opp: any) => opp.stage === query.stage);
  }
  
  // REP users: only see opportunities for orgs assigned to them
  if (user?.role === 'REP' || user?.role === 'TAE') {
    filtered = filtered.filter((opp: any) => opp.assigned_rep_id === user.id);
    return reply.send(filtered);
  }

  // Territory scoping: directors with state_market only see opps for orgs in their state(s)
  if (user?.state_market && user.role !== 'ADMIN') {
    const states = user.state_market.split(',').map((s: string) => s.trim());
    filtered = filtered.filter((opp: any) => states.includes(opp.organization_state));
    return reply.send(filtered);
  }
  
  return reply.send(filtered);
}

export async function updateOpportunityStageHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const { stage, changed_by, note, actual_revenue, actual_cost, loss_reason } = request.body as any;

  if (!stage) {
    return reply.code(400).send({ message: 'stage is required' });
  }

  // Derive changed_by from auth if not provided
  const currentUser = (request as any).currentUser;
  const effectiveChangedBy = changed_by ?? currentUser?.id;

  try {
    const updatedOpportunity = await updateOpportunityStage(Number(id), stage, effectiveChangedBy, note, { actual_revenue, actual_cost, loss_reason });
    return reply.send(updatedOpportunity);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return reply.code(404).send({ message: error.message });
    }
    if (error.message.includes('Invalid stage transition') || error.message.includes('required to close an opportunity') || error.message.includes('cannot be negative')) {
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

export async function getOpportunityByIdHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const opportunities = await getOpportunities();
  const opp = opportunities.find((o: any) => o.id === Number(id));
  if (!opp) return reply.code(404).send({ message: 'Opportunity not found' });
  return reply.send(opp);
}
