/**
 * TUF Ops 2.0 — LETTERED routes (Wave 3A).
 *
 * Every route is authorized through the APPROVED AUTH BOUNDARY
 * (`../../authz/boundary`) against the rebuilt 2.0 permission model
 * (`@packages/auth` marketPermissions). No route imports the auth mechanism
 * (users.service / credentials); they only ask the boundary.
 *
 *   GET /markets/:marketIdOrNumber   view_markets   deployments for one Market
 *   GET /:id                         view_markets   a single deployment
 *
 * The mounts are inlined per route (not a shared const) to avoid TypeScript
 * unifying one generic preHandler type across parameterised handlers.
 */

import { FastifyInstance } from 'fastify';
import { marketPermissions } from '@packages/auth';
import { requireMarketPermission } from '../../authz/boundary';
import {
  getLetteredDeploymentHandler,
  listLetteredForMarketHandler,
} from './lettered.controller';

export async function letteredRoutes(server: FastifyInstance) {
  server.get(
    '/markets/:marketIdOrNumber',
    { preHandler: [requireMarketPermission(marketPermissions.VIEW_MARKETS)] },
    listLetteredForMarketHandler,
  );

  server.get(
    '/:id',
    { preHandler: [requireMarketPermission(marketPermissions.VIEW_MARKETS)] },
    getLetteredDeploymentHandler,
  );
}
