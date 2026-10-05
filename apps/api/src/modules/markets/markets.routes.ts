/**
 * TUF Ops 2.0 — Markets routes (Wave 2A).
 *
 * Every route is authorized through the APPROVED AUTH BOUNDARY
 * (`../../authz/boundary`) against the rebuilt 2.0 permission model
 * (`@packages/auth` marketPermissions). No route imports the auth mechanism
 * (users.service / credentials); they only ask the boundary.
 *
 *   GET  /            view_markets      any operational role (rep/director/ops/admin)
 *   GET  /:idOrNumber view_markets      any operational role
 *   POST /activate    market:activate   director/admin only
 *
 * The mounts are inlined per route (not a shared const) to avoid TypeScript
 * unifying one generic preHandler type across parameterised handlers.
 */

import { FastifyInstance } from 'fastify';
import { marketPermissions } from '@packages/auth';
import { requireMarketPermission } from '../../authz/boundary';
import { activateMarketHandler, getMarketHandler, listMarketsHandler } from './markets.controller';

export async function marketsRoutes(server: FastifyInstance) {
  server.get(
    '/',
    { preHandler: [requireMarketPermission(marketPermissions.VIEW_MARKETS)] },
    listMarketsHandler,
  );

  server.post(
    '/activate',
    { preHandler: [requireMarketPermission(marketPermissions.ACTIVATE_MARKET)] },
    activateMarketHandler,
  );

  server.get(
    '/:idOrNumber',
    { preHandler: [requireMarketPermission(marketPermissions.VIEW_MARKETS)] },
    getMarketHandler,
  );
}
