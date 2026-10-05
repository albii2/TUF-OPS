/**
 * TUF Ops 2.0 — COMMAND routes (Wave 5A).
 *
 * Every route is authorized through the APPROVED AUTH BOUNDARY
 * (`../../authz/boundary`) against the rebuilt 2.0 permission model
 * (`@packages/auth` marketPermissions). No route imports the auth mechanism
 * (users.service / credentials); they only ask the boundary.
 *
 *   GET /                          view_markets   the COMMAND board
 *   GET /markets/:marketIdOrNumber view_markets   the board scoped to one Market
 *
 * READ-ONLY: both routes are GETs; there is no mutation route.
 * The mounts are inlined per route (not a shared const) to avoid TypeScript
 * unifying one generic preHandler type across parameterised handlers.
 */

import { FastifyInstance } from 'fastify';
import { marketPermissions } from '@packages/auth';
import { requireMarketPermission } from '../../authz/boundary';
import { getCommandBoardHandler, getMarketCommandHandler } from './command.controller';

export async function commandRoutes(server: FastifyInstance) {
  server.get(
    '/',
    { preHandler: [requireMarketPermission(marketPermissions.VIEW_MARKETS)] },
    getCommandBoardHandler,
  );

  server.get(
    '/markets/:marketIdOrNumber',
    { preHandler: [requireMarketPermission(marketPermissions.VIEW_MARKETS)] },
    getMarketCommandHandler,
  );
}
