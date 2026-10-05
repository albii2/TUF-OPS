/**
 * TUF Ops 2.0 — Markets HTTP handlers (Wave 2A).
 *
 * The handlers are thin: they resolve the actor, call the service, and map
 * stable reasons to status codes. Authorization happens in the route
 * preHandlers (the auth boundary); by the time a handler runs it has already
 * been authorized.
 */

import { FastifyReply, FastifyRequest } from 'fastify';
import { ActivationError } from './markets.interface';
import { activateMarket } from './markets.service';
import { getMarketByIdOrNumber, listOperationalMarkets } from './markets.read.service';
import { resolveActor } from '../../authz/boundary';

/** GET /api/v1/markets — the operational Markets list (exactly the activated markets). */
export async function listMarketsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const markets = await listOperationalMarkets();
    return reply.send({ markets, count: markets.length });
  } catch (error: any) {
    request.log?.error?.(error);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
}

/** GET /api/v1/markets/:idOrNumber — a single Market by number (`001`) or id. */
export async function getMarketHandler(request: FastifyRequest, reply: FastifyReply) {
  const raw = (request.params as Record<string, string>).idOrNumber;
  const idOrNumber = Number(raw);
  if (!Number.isInteger(idOrNumber) || idOrNumber <= 0) {
    return reply.code(400).send({ error: 'idOrNumber must be a positive integer' });
  }

  try {
    const market = await getMarketByIdOrNumber(idOrNumber);
    if (!market) return reply.code(404).send({ error: 'Market not found' });
    return reply.send({ market });
  } catch (error: any) {
    request.log?.error?.(error);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
}

/** POST /api/v1/markets/activate — the SOLE gateway that creates a Market. */
export async function activateMarketHandler(request: FastifyRequest, reply: FastifyReply) {
  const actor = resolveActor(request);
  if (!actor) return reply.code(401).send({ error: 'Authentication required' });

  try {
    const result = await activateMarket(request.body as Record<string, unknown>, {
      id: actor.id,
      role: actor.role,
    });
    return reply.code(201).send(result);
  } catch (error: any) {
    if (error instanceof ActivationError) {
      const status =
        error.reason === 'NOT_AUTHORISED'
          ? 403
          : error.reason === 'SCHOOL_ALREADY_ACTIVATED' || error.reason === 'DUPLICATE_MARKET_NUMBER'
            ? 409
            : 400;
      return reply.code(status).send({ error: error.reason, message: error.message });
    }
    request.log?.error?.(error);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
}
