/**
 * TUF Ops 2.0 — Drops OS integration routes (Wave 4A).
 *
 * Every route is authorized through the APPROVED AUTH BOUNDARY
 * (`../../authz/boundary`) against the rebuilt 2.0 permission model
 * (`@packages/auth` marketPermissions). No route imports the auth mechanism
 * (users.service / credentials); they only ask the boundary.
 *
 *   GET /markets/:marketIdOrNumber/commerce   view_markets   Drops commerce, cache-first
 *   GET /deployments/:id/commerce             view_markets   same, scoped to a deployment
 *
 * READ-ONLY: both routes are GETs; there is no mutation route that reaches Drops.
 * The mounts are inlined per route (not a shared const) to avoid TypeScript
 * unifying one generic preHandler type across parameterised handlers.
 */

import { FastifyInstance } from 'fastify';
import { marketPermissions } from '@packages/auth';
import { requireMarketPermission } from '../../authz/boundary';
import {
  getDeploymentCommerceHandler,
  getMarketCommerceHandler,
} from './drops.controller';

export async function integrationRoutes(server: FastifyInstance) {
  server.get(
    '/markets/:marketIdOrNumber/commerce',
    { preHandler: [requireMarketPermission(marketPermissions.VIEW_MARKETS)] },
    getMarketCommerceHandler,
  );

  server.get(
    '/deployments/:id/commerce',
    { preHandler: [requireMarketPermission(marketPermissions.VIEW_MARKETS)] },
    getDeploymentCommerceHandler,
  );
}
