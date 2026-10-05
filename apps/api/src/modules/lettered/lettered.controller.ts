/**
 * TUF Ops 2.0 — LETTERED HTTP handlers (Wave 3A).
 *
 * Read-only surface. The handlers are thin: they validate params, call the read
 * service, and map to status codes. Authorization happens in the route
 * preHandlers (the approved auth boundary); by the time a handler runs it has
 * already been authorized.
 */

import { FastifyReply, FastifyRequest } from 'fastify';
import {
  getLetteredDeploymentById,
  listLetteredDeploymentsForMarket,
} from './lettered.read.service';

/** GET /api/v1/lettered/markets/:marketIdOrNumber — deployments for one Market. */
export async function listLetteredForMarketHandler(request: FastifyRequest, reply: FastifyReply) {
  const raw = (request.params as Record<string, string>).marketIdOrNumber;
  const marketIdOrNumber = Number(raw);
  if (!Number.isInteger(marketIdOrNumber) || marketIdOrNumber <= 0) {
    return reply.code(400).send({ error: 'marketIdOrNumber must be a positive integer' });
  }

  try {
    const deployments = await listLetteredDeploymentsForMarket(marketIdOrNumber);
    return reply.send({ deployments, count: deployments.length });
  } catch (error: any) {
    request.log?.error?.(error);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
}

/** GET /api/v1/lettered/:id — a single deployment by id. */
export async function getLetteredDeploymentHandler(request: FastifyRequest, reply: FastifyReply) {
  const raw = (request.params as Record<string, string>).id;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return reply.code(400).send({ error: 'id must be a positive integer' });
  }

  try {
    const deployment = await getLetteredDeploymentById(id);
    if (!deployment) return reply.code(404).send({ error: 'Lettered deployment not found' });
    return reply.send({ deployment });
  } catch (error: any) {
    request.log?.error?.(error);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
}
