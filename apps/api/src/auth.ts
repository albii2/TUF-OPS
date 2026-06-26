import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import { getPermissions, hasPermission, permissions, PermissionDenied, STAGES, type Permission } from '@packages/auth';
import { verifyAuthToken } from './modules/users/users.service';
import type { SafeUser } from './modules/users/users.interface';
import { getOpportunityById } from './modules/opportunities/opportunities.service';
import { OpportunityStage } from './modules/opportunities/opportunities.interface';

declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: SafeUser | null;
    currentPermissions?: Set<Permission>;
  }
}

export async function authMiddleware(request: FastifyRequest) {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : undefined;
  const user = await verifyAuthToken(token);
  request.currentUser = user;
  request.currentPermissions = getPermissions(user?.role);
}

export function permissionErrorHandler(error: unknown, reply: FastifyReply) {
  if (error instanceof PermissionDenied || (error as { statusCode?: number })?.statusCode === 403) {
    return reply.code(403).send({ error: error instanceof Error ? error.message : 'Permission denied' });
  }
  throw error;
}

/**
 * Stage values at or past Closed Won, inclusive.
 * TAE edit permissions degrade at these stages.
 */
const POST_CLOSED_WON_STAGES: Set<string> = new Set([
  STAGES.CLOSED_WON,
  // Post-Closed Won fulfillment stages (lowercase canonical values)
  STAGES.READY_FOR_OPS,
  STAGES.IN_PRODUCTION,
  STAGES.QUALITY_CONTROL,
  STAGES.SHIPPED,
  STAGES.DELIVERED,
]);

/**
 * Fields that TAE is always allowed to edit regardless of opportunity stage.
 * These are relationship management fields per SOS 8.2 and TUF-002.
 */
export const RELATIONSHIP_FIELDS: ReadonlySet<string> = new Set([
  'next_action',       // Notes / next action
  // Reserved for future relationship fields (per TUF-002):
  // 'testimonials',
  // 'renewal_flags',
]);

export function isClosedWonOrLater(stage: string): boolean {
  return POST_CLOSED_WON_STAGES.has(stage);
}

export function requirePermission(permission: Permission): preHandlerHookHandler {
  return (request, reply, done) => {
    if (process.env.ROLE_BASED_PERMISSIONS_ENABLED === 'false') return done();
    if (!request.currentUser) {
      reply.code(401).send({ error: 'Authentication required' });
      return;
    }
    if (!hasPermission(request.currentUser.role, permission)) {
      done(new PermissionDenied(`Permission '${permission}' required. Your role '${request.currentUser.role}' does not have it.`));
      return;
    }
    done();
  };
}

/**
 * Stage-aware preHandler for opportunity edit (PUT /:id).
 *
 * - First, checks the base edit permission (EDIT_OPPORTUNITY_PRE_CW).
 * - If the user is a TAE and the opportunity is at Closed Won or later,
 *   only relationship fields may be modified. Any attempt to modify
 *   non-relationship fields (order data) is rejected with 403.
 * - Non-TAE users are governed solely by their base permissions.
 */
export function requireStageAwareEditPermission(basePermission: Permission): preHandlerHookHandler {
  return async (request, reply) => {
    if (process.env.ROLE_BASED_PERMISSIONS_ENABLED === 'false') return;

    if (!request.currentUser) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    if (!hasPermission(request.currentUser.role, basePermission)) {
      throw new PermissionDenied(
        `Permission '${basePermission}' required. Your role '${request.currentUser.role}' does not have it.`,
      );
    }

    // Stage-aware degradation applies only to TAE
    const { normalizeRole, roles } = require('@packages/auth');
    if (normalizeRole(request.currentUser.role) !== roles.TAE) return;

    const { id } = (request.params as Record<string, string>);
    if (!id) return;

    let opportunity;
    try {
      opportunity = await getOpportunityById(Number(id));
    } catch {
      // If opportunity doesn't exist, let the route handler return 404
      return;
    }

    if (!isClosedWonOrLater(opportunity.stage)) return;

    // At Closed Won or later: TAE may only edit relationship fields
    const body = (request.body || {}) as Record<string, unknown>;
    const fieldsBeingEdited = Object.keys(body);

    // Remove fields that are identity/metadata (not real edits)
    const nonIdentityFields = fieldsBeingEdited.filter(
      (f) => f !== 'id' && f !== 'updated_at' && f !== 'created_at' && f !== 'updated_by',
    );

    if (nonIdentityFields.length === 0) return; // No actual data edits

    const nonRelationshipFields = nonIdentityFields.filter((f) => !RELATIONSHIP_FIELDS.has(f));

    if (nonRelationshipFields.length > 0) {
      throw new PermissionDenied(
        `TAE cannot edit order fields after Closed Won. Blocked fields: ${nonRelationshipFields.join(', ')}. ` +
        `Only relationship fields (${[...RELATIONSHIP_FIELDS].join(', ')}) are editable at this stage.`,
      );
    }
  };
}

/**
 * Stage-aware preHandler for opportunity stage advancement (PUT /:id/stage).
 *
 * - First, checks the base advance permission (ADVANCE_STAGE_PRE_CW).
 * - TAE users cannot advance stage beyond Closed Won (the VALID_TRANSITIONS
 *   already enforce this at the service level, but this preHandler adds a
 *   permission-layer enforcement).
 */
export function requireStageAwareAdvancePermission(basePermission: Permission): preHandlerHookHandler {
  return async (request, reply) => {
    if (process.env.ROLE_BASED_PERMISSIONS_ENABLED === 'false') return;

    if (!request.currentUser) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    if (!hasPermission(request.currentUser.role, basePermission)) {
      throw new PermissionDenied(
        `Permission '${basePermission}' required. Your role '${request.currentUser.role}' does not have it.`,
      );
    }

    // Stage-aware degradation applies only to TAE
    const { normalizeRole, roles } = require('@packages/auth');
    if (normalizeRole(request.currentUser.role) !== roles.TAE) return;

    const { id } = (request.params as Record<string, string>);
    if (!id) return;

    let opportunity;
    try {
      opportunity = await getOpportunityById(Number(id));
    } catch {
      return; // Let route handler return 404
    }

    // TAE cannot advance stage beyond Closed Won
    // The service layer's VALID_TRANSITIONS already enforces this (CW → []),
    // but we add an explicit permission-layer check for defense in depth.
    if (isClosedWonOrLater(opportunity.stage)) {
      throw new PermissionDenied(
        `TAE cannot advance stage beyond Closed Won. Current stage: ${opportunity.stage}.`,
      );
    }
  };
}

export { permissions };
