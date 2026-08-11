"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissions = exports.RELATIONSHIP_FIELDS = void 0;
exports.serializeForRole = serializeForRole;
exports.authMiddleware = authMiddleware;
exports.permissionErrorHandler = permissionErrorHandler;
exports.isClosedWonOrLater = isClosedWonOrLater;
exports.requirePermission = requirePermission;
exports.requireCertification = requireCertification;
exports.requireStageAwareEditPermission = requireStageAwareEditPermission;
exports.requireStageAwareAdvancePermission = requireStageAwareAdvancePermission;
const auth_1 = require("@packages/auth");
Object.defineProperty(exports, "permissions", { enumerable: true, get: function () { return auth_1.permissions; } });
const users_service_1 = require("./modules/users/users.service");
const opportunities_service_1 = require("./modules/opportunities/opportunities.service");
/**
 * Fields stripped from API responses for the Operations role.
 * Operations sees only fulfillment-relevant data — no pricing,
 * pipeline metrics, or sales KPIs.
 */
const OPERATIONS_EXCLUDED_FIELDS = new Set([
    'value',
    'estimated_revenue',
    'expected_close_date',
]);
/**
 * Serialize response data based on the requesting user's role.
 *
 * When the caller has the Operations role, pricing, pipeline-metric,
 * and sales-KPI fields are stripped from the payload.  All other roles
 * receive the response unchanged.
 */
function serializeForRole(data, role) {
    if (!(0, auth_1.isOperations)(role))
        return data;
    if (Array.isArray(data)) {
        return data.map((item) => stripOperationsFields(item));
    }
    return stripOperationsFields(data);
}
function stripOperationsFields(obj) {
    const result = { ...obj };
    for (const field of OPERATIONS_EXCLUDED_FIELDS) {
        delete result[field];
    }
    return result;
}
async function authMiddleware(request) {
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : undefined;
    const user = await (0, users_service_1.verifyAuthToken)(token);
    request.currentUser = user;
    request.currentPermissions = (0, auth_1.getPermissions)(user?.role);
}
function permissionErrorHandler(error, reply) {
    if (error instanceof auth_1.PermissionDenied || error?.statusCode === 403) {
        return reply.code(403).send({ error: error instanceof Error ? error.message : 'Permission denied' });
    }
    throw error;
}
/**
 * Stage values at or past Closed Won, inclusive.
 * TAE edit permissions degrade at these stages.
 */
const POST_CLOSED_WON_STAGES = new Set([
    auth_1.STAGES.CLOSED_WON,
    // Post-Closed Won fulfillment stages (lowercase canonical values)
    auth_1.STAGES.READY_FOR_OPS,
    auth_1.STAGES.IN_PRODUCTION,
    auth_1.STAGES.QUALITY_CONTROL,
    auth_1.STAGES.SHIPPED,
    auth_1.STAGES.DELIVERED,
]);
/**
 * Fields that TAE is always allowed to edit regardless of opportunity stage.
 * These are relationship management fields per SOS 8.2 and TUF-002.
 */
exports.RELATIONSHIP_FIELDS = new Set([
    'next_action', // Notes / next action
    // Reserved for future relationship fields (per TUF-002):
    // 'testimonials',
    // 'renewal_flags',
]);
function isClosedWonOrLater(stage) {
    return POST_CLOSED_WON_STAGES.has(stage);
}
function requirePermission(permission) {
    return (request, reply, done) => {
        if (process.env.ROLE_BASED_PERMISSIONS_ENABLED === 'false')
            return done();
        if (!request.currentUser) {
            reply.code(401).send({ error: 'Authentication required' });
            return;
        }
        if (!(0, auth_1.hasPermission)(request.currentUser.role, permission)) {
            done(new auth_1.PermissionDenied(`Permission '${permission}' required. Your role '${request.currentUser.role}' does not have it.`));
            return;
        }
        done();
    };
}
/**
 * Certification gate: uncertified REP users are blocked from CRM API routes.
 * Non-REP roles (ADMIN, DIRECTOR, REGIONAL_DIRECTOR) bypass this gate.
 *
 * REP users who have not completed Academy certification (hr_docs + practical
 * exercise + director signoff) receive 403 until certified.  This middleware is
 * intended for CRM resource routes (organizations, opportunities, orders, etc.)
 * and should NOT be applied to auth or training endpoints.
 */
function requireCertification() {
    return (request, reply, done) => {
        if (process.env.CERTIFICATION_GATING_ENABLED === 'false')
            return done();
        const user = request.currentUser;
        if (!user) {
            reply.code(401).send({ error: 'Authentication required' });
            return;
        }
        // Only REP users are gated by certification
        if (user.role !== 'REP' && user.role !== 'sales_rep')
            return done();
        if (!user.is_certified) {
            reply.code(403).send({
                error: 'Certification required',
                message: 'You must complete TUF Academy certification before accessing CRM features. Visit /training to get started.',
            });
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
function requireStageAwareEditPermission(basePermission) {
    return async (request, reply) => {
        if (process.env.ROLE_BASED_PERMISSIONS_ENABLED === 'false')
            return;
        if (!request.currentUser) {
            return reply.code(401).send({ error: 'Authentication required' });
        }
        if (!(0, auth_1.hasPermission)(request.currentUser.role, basePermission)) {
            throw new auth_1.PermissionDenied(`Permission '${basePermission}' required. Your role '${request.currentUser.role}' does not have it.`);
        }
        // Stage-aware degradation applies only to TAE
        const { normalizeRole, roles } = require('@packages/auth');
        if (normalizeRole(request.currentUser.role) !== roles.TAE)
            return;
        const { id } = request.params;
        if (!id)
            return;
        let opportunity;
        try {
            opportunity = await (0, opportunities_service_1.getOpportunityById)(Number(id));
        }
        catch {
            // If opportunity doesn't exist, let the route handler return 404
            return;
        }
        if (!isClosedWonOrLater(opportunity.stage))
            return;
        // At Closed Won or later: TAE may only edit relationship fields
        const body = (request.body || {});
        const fieldsBeingEdited = Object.keys(body);
        // Remove fields that are identity/metadata (not real edits)
        const nonIdentityFields = fieldsBeingEdited.filter((f) => f !== 'id' && f !== 'updated_at' && f !== 'created_at' && f !== 'updated_by');
        if (nonIdentityFields.length === 0)
            return; // No actual data edits
        const nonRelationshipFields = nonIdentityFields.filter((f) => !exports.RELATIONSHIP_FIELDS.has(f));
        if (nonRelationshipFields.length > 0) {
            throw new auth_1.PermissionDenied(`TAE cannot edit order fields after Closed Won. Blocked fields: ${nonRelationshipFields.join(', ')}. ` +
                `Only relationship fields (${[...exports.RELATIONSHIP_FIELDS].join(', ')}) are editable at this stage.`);
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
function requireStageAwareAdvancePermission(basePermission) {
    return async (request, reply) => {
        if (process.env.ROLE_BASED_PERMISSIONS_ENABLED === 'false')
            return;
        if (!request.currentUser) {
            return reply.code(401).send({ error: 'Authentication required' });
        }
        if (!(0, auth_1.hasPermission)(request.currentUser.role, basePermission)) {
            throw new auth_1.PermissionDenied(`Permission '${basePermission}' required. Your role '${request.currentUser.role}' does not have it.`);
        }
        // Stage-aware degradation applies only to TAE
        const { normalizeRole, roles } = require('@packages/auth');
        if (normalizeRole(request.currentUser.role) !== roles.TAE)
            return;
        const { id } = request.params;
        if (!id)
            return;
        let opportunity;
        try {
            opportunity = await (0, opportunities_service_1.getOpportunityById)(Number(id));
        }
        catch {
            return; // Let route handler return 404
        }
        // TAE cannot advance stage beyond Closed Won
        // The service layer's VALID_TRANSITIONS already enforces this (CW → []),
        // but we add an explicit permission-layer check for defense in depth.
        if (isClosedWonOrLater(opportunity.stage)) {
            throw new auth_1.PermissionDenied(`TAE cannot advance stage beyond Closed Won. Current stage: ${opportunity.stage}.`);
        }
    };
}
//# sourceMappingURL=auth.js.map