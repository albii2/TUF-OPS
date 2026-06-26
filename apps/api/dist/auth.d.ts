import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import { permissions, type Permission } from '@packages/auth';
import type { SafeUser } from './modules/users/users.interface';
declare module 'fastify' {
    interface FastifyRequest {
        currentUser?: SafeUser | null;
        currentPermissions?: Set<Permission>;
    }
}
/**
 * Serialize response data based on the requesting user's role.
 *
 * When the caller has the Operations role, pricing, pipeline-metric,
 * and sales-KPI fields are stripped from the payload.  All other roles
 * receive the response unchanged.
 */
export declare function serializeForRole<T extends Record<string, unknown> | Array<Record<string, unknown>>>(data: T, role: unknown): T;
export declare function authMiddleware(request: FastifyRequest): Promise<void>;
export declare function permissionErrorHandler(error: unknown, reply: FastifyReply): FastifyReply<import("fastify").RawServerDefault, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, import("fastify").RouteGenericInterface, unknown, import("fastify").FastifySchema, import("fastify").FastifyTypeProviderDefault, unknown>;
/**
 * Fields that TAE is always allowed to edit regardless of opportunity stage.
 * These are relationship management fields per SOS 8.2 and TUF-002.
 */
export declare const RELATIONSHIP_FIELDS: ReadonlySet<string>;
export declare function isClosedWonOrLater(stage: string): boolean;
export declare function requirePermission(permission: Permission): preHandlerHookHandler;
/**
 * Certification gate: uncertified REP users are blocked from CRM API routes.
 * Non-REP roles (ADMIN, DIRECTOR, REGIONAL_DIRECTOR) bypass this gate.
 *
 * REP users who have not completed Academy certification (hr_docs + practical
 * exercise + director signoff) receive 403 until certified.  This middleware is
 * intended for CRM resource routes (organizations, opportunities, orders, etc.)
 * and should NOT be applied to auth or training endpoints.
 */
export declare function requireCertification(): preHandlerHookHandler;
/**
 * Stage-aware preHandler for opportunity edit (PUT /:id).
 *
 * - First, checks the base edit permission (EDIT_OPPORTUNITY_PRE_CW).
 * - If the user is a TAE and the opportunity is at Closed Won or later,
 *   only relationship fields may be modified. Any attempt to modify
 *   non-relationship fields (order data) is rejected with 403.
 * - Non-TAE users are governed solely by their base permissions.
 */
export declare function requireStageAwareEditPermission(basePermission: Permission): preHandlerHookHandler;
/**
 * Stage-aware preHandler for opportunity stage advancement (PUT /:id/stage).
 *
 * - First, checks the base advance permission (ADVANCE_STAGE_PRE_CW).
 * - TAE users cannot advance stage beyond Closed Won (the VALID_TRANSITIONS
 *   already enforce this at the service level, but this preHandler adds a
 *   permission-layer enforcement).
 */
export declare function requireStageAwareAdvancePermission(basePermission: Permission): preHandlerHookHandler;
export { permissions };
//# sourceMappingURL=auth.d.ts.map