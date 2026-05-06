import { FastifyReply, FastifyRequest } from 'fastify';
import { createCreativeRequest, listCreativeRequestsByOpportunity, updateCreativeRequest } from './creative-requests.service';

export async function getOpportunityCreativeRequestsHandler(request: FastifyRequest, reply: FastifyReply) {
  const { opportunityId } = request.params as any;
  return reply.send(await listCreativeRequestsByOpportunity(Number(opportunityId)));
}
export async function createOpportunityCreativeRequestHandler(request: FastifyRequest, reply: FastifyReply) {
  try { const { opportunityId } = request.params as any; return reply.code(201).send(await createCreativeRequest(Number(opportunityId), request.body as any)); }
  catch (error: any) { return reply.code(400).send({ message: error.message || 'Unable to create creative request' }); }
}
export async function patchCreativeRequestHandler(request: FastifyRequest, reply: FastifyReply) {
  try { const { id } = request.params as any; return reply.send(await updateCreativeRequest(Number(id), request.body as any)); }
  catch (error: any) { return reply.code(error.message.includes('not found') ? 404 : 400).send({ message: error.message }); }
}
