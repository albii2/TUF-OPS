/**
 * TUF Ops 2.0 — APPROVED AUTH BOUNDARY (Wave 2A).
 *
 * Founder ruling R6 requires a clean auth boundary: domain modules
 * (Markets / LETTERED / ISSUE / tasks / revenue) must not couple to the auth
 * mechanism (the phone/PIN login, token signing, credential storage, users
 * table). They must only ever see an *actor* and ask the boundary a question.
 *
 * This module is that boundary. It is the ONLY auth import a 2.0 domain route
 * is allowed to make:
 *
 *     import { requireMarketPermission, marketPermissions } from '../../authz/boundary';
 *
 * Direction of dependency is enforced by convention and by the boundary
 * invariant test: auth depends on nothing domain-specific; domain code depends
 * on the boundary, never on `users.service` / `credentials` / `auth.ts` internals.
 *
 * The mechanism itself is unchanged (R6): the global `authMiddleware` still
 * parses the bearer token via `verifyAuthToken` and attaches
 * `request.currentUser`. This boundary only *interprets* that identity for the
 * rebuilt 2.0 authorization model.
 */

import type { preHandlerHookHandler } from 'fastify';
import {
  PermissionDenied,
  requireMarketPermission as requireCanonicalMarketPermission,
  toCanonicalRole,
  type CanonicalRole,
  type MarketPermission,
} from '@packages/auth';

/** The identity a 2.0 domain handler is allowed to know about. */
export interface DomainActor {
  /** `users.id` — the accountable person. */
  id: number;
  /** Raw role string as stored. */
  role: string;
  /** Canonical 2.0 role (`rep|director|ops|admin`), or null if unrecognised. */
  canonicalRole: CanonicalRole | null;
}

/**
 * Resolve the request's actor WITHOUT throwing. Returns null for anonymous
 * callers. Domain code that only needs identity (e.g. `created_by`) uses this;
 * route guards use the `require*` helpers below.
 */
export function resolveActor(request: { currentUser?: { id?: number; role?: string } | null }): DomainActor | null {
  const user = request.currentUser;
  if (!user || typeof user.id !== 'number') return null;
  const role = String(user.role ?? '');
  return { id: user.id, role, canonicalRole: toCanonicalRole(role) };
}

/**
 * Route guard for a 2.0 market permission.
 *   - no authenticated actor  → 401
 *   - actor lacks permission  → 403 (PermissionDenied, mapped by the error handler)
 *
 * The role model itself lives in `@packages/auth` (`requireMarketPermission`);
 * this wrapper only adapts HTTP request/response semantics. That separation is
 * what keeps the authorization MODEL testable without HTTP and the HTTP adapter
 * trivial.
 */
export function requireMarketPermission(permission: MarketPermission): preHandlerHookHandler {
  return (request, reply, done) => {
    const actor = resolveActor(request);
    if (!actor) {
      reply.code(401).send({ error: 'Authentication required' });
      return;
    }
    try {
      requireCanonicalMarketPermission(actor.role, permission);
      done();
    } catch (error) {
      if (error instanceof PermissionDenied) {
        // Respond directly so the guard is self-contained and its 403 does not
        // depend on a particular global error handler being installed.
        reply.code(403).send({ error: error.message });
        return;
      }
      done(error as Error);
    }
  };
}

export { PermissionDenied };
