/**
 * TUF Ops 2.0 — COMMAND HTTP handlers (Wave 5A).
 *
 * Read-only. Thin: validate params, call the COMMAND read service, map to status
 * codes. Authorization happens in the route preHandlers (the approved auth
 * boundary); by the time a handler runs it has already been authorized.
 *
 * An empty board is HTTP 200 with `empty:true` / `count:0` — never a 500 and
 * never a fabricated obligation.
 */

import { FastifyReply, FastifyRequest } from 'fastify';
import { getCommandBoard, getCommandForMarket } from './command.read.service.js';

/** GET /api/v1/command — the whole "what needs to be done today" board. */
export async function getCommandBoardHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const board = await getCommandBoard();
    return reply.send({ command: board });
  } catch (error: any) {
    request.log?.error?.(error);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
}

/** GET /api/v1/command/markets/:marketIdOrNumber — the board scoped to one Market. */
export async function getMarketCommandHandler(request: FastifyRequest, reply: FastifyReply) {
  const raw = (request.params as Record<string, string>).marketIdOrNumber;
  const marketIdOrNumber = Number(raw);
  if (!Number.isInteger(marketIdOrNumber) || marketIdOrNumber <= 0) {
    return reply.code(400).send({ error: 'marketIdOrNumber must be a positive integer' });
  }

  try {
    const board = await getCommandForMarket(marketIdOrNumber);
    return reply.send({ command: board });
  } catch (error: any) {
    request.log?.error?.(error);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
}
