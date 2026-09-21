import { FastifyInstance } from 'fastify';
import { permissions, requireCertification, requirePermission } from '../../auth';
import { listHandler, getHandler, createHandler, updateHandler, deleteHandler, decisionsHandler, lighthouseHandler, createStatusCheckHandler, getStatusCheckHandler } from './intake.controller';

/**
 * Executive intake — Lighthouse, status checks, decisions, and the intake backlog.
 *
 * AUTHORIZATION, and why it is enforced here rather than in the server bootstrap: the global
 * `onRequest` hook (authMiddleware) only PARSES a bearer token and attaches the user — it does not
 * reject anonymous callers. Each module guards its own routes.
 *
 * This module had no guards at all, and it was never mounted. Mounting it without guards would have
 * published executive intake data — company-wide attention scoring, open decisions, leadership
 * status-check responses — to the public internet. Because these paths previously returned 404, an
 * unguarded mount would have CREATED a leak, not inherited one. Verified before and after: unguarded
 * the handlers ran anonymously (500 from a DB-less server, not 401); guarded they return 401, while
 * /organizations and friends still return 401 and unknown paths still return 404.
 *
 * WHY VIEW_TERRITORY_HEALTH: no executive-intake permission exists in packages/auth, and adding one is
 * a permissions-model change (every role map would need reviewing) rather than a repair. This is the
 * closest existing grant meaning "may see company-wide operational health": ADMIN holds every
 * permission by construction, DIRECTOR holds it, and TAE does not — so a rep cannot read the executive
 * view. If this surface should be ADMIN-only, that is a deliberate decision requiring a new permission;
 * it is not a safe default to assume.
 *
 * The guards are inlined per route (as in organizations.routes.ts) rather than hoisted into a shared
 * constant: a shared object makes TypeScript try to unify one generic preHandler type with every
 * handler's `FastifyRequest<{ Params: ... }>`, which fails to compile.
 */
export async function intakeRoutes(server: FastifyInstance) {
  // GET /api/v1/intake/lighthouse — Executive Command Center view
  server.get('/lighthouse', { preHandler: [requireCertification(), requirePermission(permissions.VIEW_TERRITORY_HEALTH)] }, lighthouseHandler);
  // POST /api/v1/intake/status-check — create batch status check
  server.post('/status-check', { preHandler: [requireCertification(), requirePermission(permissions.VIEW_TERRITORY_HEALTH)] }, createStatusCheckHandler);
  // GET /api/v1/intake/status-check — get response summary
  server.get('/status-check', { preHandler: [requireCertification(), requirePermission(permissions.VIEW_TERRITORY_HEALTH)] }, getStatusCheckHandler);
  // GET /api/v1/intake — list all
  server.get('/', { preHandler: [requireCertification(), requirePermission(permissions.VIEW_TERRITORY_HEALTH)] }, listHandler);
  // GET /api/v1/intake/decisions — open critical/high decisions
  server.get('/decisions', { preHandler: [requireCertification(), requirePermission(permissions.VIEW_TERRITORY_HEALTH)] }, decisionsHandler);
  // GET /api/v1/intake/:id — single item
  server.get<{ Params: { id: string } }>('/:id', { preHandler: [requireCertification(), requirePermission(permissions.VIEW_TERRITORY_HEALTH)] }, getHandler);
  // POST /api/v1/intake — create
  server.post('/', { preHandler: [requireCertification(), requirePermission(permissions.VIEW_TERRITORY_HEALTH)] }, createHandler);
  // PUT /api/v1/intake/:id — update
  server.put<{ Params: { id: string } }>('/:id', { preHandler: [requireCertification(), requirePermission(permissions.VIEW_TERRITORY_HEALTH)] }, updateHandler);
  // DELETE /api/v1/intake/:id — delete
  server.delete<{ Params: { id: string } }>('/:id', { preHandler: [requireCertification(), requirePermission(permissions.VIEW_TERRITORY_HEALTH)] }, deleteHandler);
}
