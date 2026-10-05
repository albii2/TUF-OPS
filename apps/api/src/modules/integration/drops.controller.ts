/**
 * TUF Ops 2.0 — Drops OS integration HTTP handlers (Wave 4A).
 *
 * Read-only surface. Handlers are thin: validate params, call the reader, map to
 * status codes. Authorization happens in the route preHandlers (the approved auth
 * boundary); by the time a handler runs it has already been authorized.
 *
 * IMPORTANT: a Market that exists but has NO cached Drops data returns HTTP 200
 * with `hasData:false` / `noDataYet:true` — an explicit empty state, never a 500
 * and never a fabricated zero (DROPS_CONTRACT §6 #3).
 */

import { FastifyReply, FastifyRequest } from 'fastify';
import {
  getDeploymentCommerceMetrics,
  getMarketCommerceMetrics,
} from './drops.metrics.service.js';
import { getMarketByIdOrNumber } from '../markets/markets.read.service.js';
import { getLetteredDeploymentById } from '../lettered/lettered.read.service.js';

function wantsRefresh(request: FastifyRequest): boolean {
  const raw = (request.query as Record<string, unknown> | undefined)?.refresh;
  return raw === '1' || raw === 'true' || raw === true;
}

/** GET /api/v1/integration/markets/:marketIdOrNumber/commerce */
export async function getMarketCommerceHandler(request: FastifyRequest, reply: FastifyReply) {
  const raw = (request.params as Record<string, string>).marketIdOrNumber;
  const marketIdOrNumber = Number(raw);
  if (!Number.isInteger(marketIdOrNumber) || marketIdOrNumber <= 0) {
    return reply.code(400).send({ error: 'marketIdOrNumber must be a positive integer' });
  }

  try {
    const market = await getMarketByIdOrNumber(marketIdOrNumber);
    if (!market) return reply.code(404).send({ error: 'Market not found' });

    const commerce = await getMarketCommerceMetrics(marketIdOrNumber, {}, { refresh: wantsRefresh(request) });
    return reply.send({ commerce });
  } catch (error: any) {
    request.log?.error?.(error);
    // Even a total failure must not surface as a fabricated number.
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
}

/** GET /api/v1/integration/deployments/:id/commerce */
export async function getDeploymentCommerceHandler(request: FastifyRequest, reply: FastifyReply) {
  const raw = (request.params as Record<string, string>).id;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return reply.code(400).send({ error: 'id must be a positive integer' });
  }

  try {
    const deployment = await getLetteredDeploymentById(id);
    if (!deployment) return reply.code(404).send({ error: 'Lettered deployment not found' });

    const commerce = await getDeploymentCommerceMetrics(id, {}, { refresh: wantsRefresh(request) });
    return reply.send({ commerce });
  } catch (error: any) {
    request.log?.error?.(error);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
}
