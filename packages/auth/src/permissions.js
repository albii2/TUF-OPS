"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolePermissions = exports.permissions = void 0;
exports.getPermissions = getPermissions;
const roles_js_1 = require("./roles.js");
exports.permissions = {
    CREATE_ORGANIZATION: 'create_organization',
    VIEW_ORGANIZATION_OWN: 'view_organization_own',
    VIEW_ORGANIZATION_TEAM: 'view_organization_team',
    EDIT_ORGANIZATION_OWN: 'edit_organization_own',
    CREATE_OPPORTUNITY: 'create_opportunity',
    VIEW_OPPORTUNITY_OWN: 'view_opportunity_own',
    VIEW_OPPORTUNITY_TEAM: 'view_opportunity_team',
    EDIT_OPPORTUNITY_PRE_CW: 'edit_opportunity_pre_cw',
    EDIT_OPPORTUNITY_POST_CW: 'edit_opportunity_post_cw',
    ADVANCE_STAGE_PRE_CW: 'advance_stage_pre_cw',
    ADVANCE_STAGE_POST_CW: 'advance_stage_post_cw',
    SET_CLOSED_WON: 'set_closed_won',
    VIEW_FULFILLMENT_STAGE: 'view_fulfillment_stage',
    UPDATE_FULFILLMENT_STAGE: 'update_fulfillment_stage',
    VIEW_PRODUCTION_DETAILS: 'view_production_details',
    VIEW_UNASSIGNED_LEADS: 'view_unassigned_leads',
    CLAIM_UNASSIGNED_LEAD: 'claim_unassigned_lead',
    ASSIGN_LEAD_SELF: 'assign_lead_self',
    ASSIGN_LEAD_TEAM: 'assign_lead_team',
    REBALANCE_LEADS: 'rebalance_leads',
    VIEW_PERSONAL_PIPELINE: 'view_personal_pipeline',
    VIEW_TEAM_PIPELINE: 'view_team_pipeline',
    VIEW_TERRITORY_HEALTH: 'view_territory_health',
    VIEW_OPERATIONS_QUEUE: 'view_operations_queue',
    VIEW_CERT_PROGRESS_OWN: 'view_cert_progress_own',
    VIEW_CERT_PROGRESS_TEAM: 'view_cert_progress_team',
    VIEW_RELATIONSHIP_HISTORY: 'view_relationship_history',
    LOG_RELATIONSHIP_ACTIVITY: 'log_relationship_activity',
    EDIT_RELATIONSHIP_FIELDS: 'edit_relationship_fields',
    VIEW_RENEWAL_PIPELINE: 'view_renewal_pipeline',
    INVITE_USER: 'invite_user',
    DEACTIVATE_USER: 'deactivate_user',
    CONFIGURE_TERRITORY: 'configure_territory',
    VIEW_ACADEMY_MODULES: 'view_academy_modules',
    VIEW_GUIDED_TOURS: 'view_guided_tours',
};
const TAE_PERMISSIONS = [
    exports.permissions.CREATE_ORGANIZATION, exports.permissions.VIEW_ORGANIZATION_OWN, exports.permissions.EDIT_ORGANIZATION_OWN,
    exports.permissions.CREATE_OPPORTUNITY, exports.permissions.VIEW_OPPORTUNITY_OWN, exports.permissions.EDIT_OPPORTUNITY_PRE_CW,
    exports.permissions.ADVANCE_STAGE_PRE_CW, exports.permissions.VIEW_FULFILLMENT_STAGE, exports.permissions.VIEW_PRODUCTION_DETAILS,
    exports.permissions.VIEW_UNASSIGNED_LEADS, exports.permissions.CLAIM_UNASSIGNED_LEAD, exports.permissions.VIEW_PERSONAL_PIPELINE,
    exports.permissions.VIEW_CERT_PROGRESS_OWN, exports.permissions.VIEW_RELATIONSHIP_HISTORY, exports.permissions.LOG_RELATIONSHIP_ACTIVITY,
    exports.permissions.EDIT_RELATIONSHIP_FIELDS, exports.permissions.VIEW_RENEWAL_PIPELINE, exports.permissions.VIEW_ACADEMY_MODULES, exports.permissions.VIEW_GUIDED_TOURS,
];
const DIRECTOR_PERMISSIONS = [
    exports.permissions.CREATE_ORGANIZATION, exports.permissions.VIEW_ORGANIZATION_OWN, exports.permissions.VIEW_ORGANIZATION_TEAM,
    exports.permissions.EDIT_ORGANIZATION_OWN, exports.permissions.CREATE_OPPORTUNITY, exports.permissions.VIEW_OPPORTUNITY_OWN,
    exports.permissions.VIEW_OPPORTUNITY_TEAM, exports.permissions.EDIT_OPPORTUNITY_PRE_CW, exports.permissions.ADVANCE_STAGE_PRE_CW,
    exports.permissions.SET_CLOSED_WON, exports.permissions.VIEW_FULFILLMENT_STAGE, exports.permissions.VIEW_PRODUCTION_DETAILS,
    exports.permissions.VIEW_UNASSIGNED_LEADS, exports.permissions.CLAIM_UNASSIGNED_LEAD, exports.permissions.ASSIGN_LEAD_SELF,
    exports.permissions.ASSIGN_LEAD_TEAM, exports.permissions.REBALANCE_LEADS, exports.permissions.VIEW_PERSONAL_PIPELINE,
    exports.permissions.VIEW_TEAM_PIPELINE, exports.permissions.VIEW_TERRITORY_HEALTH, exports.permissions.VIEW_CERT_PROGRESS_OWN,
    exports.permissions.VIEW_CERT_PROGRESS_TEAM, exports.permissions.VIEW_RELATIONSHIP_HISTORY, exports.permissions.LOG_RELATIONSHIP_ACTIVITY,
    exports.permissions.VIEW_RENEWAL_PIPELINE, exports.permissions.INVITE_USER, exports.permissions.DEACTIVATE_USER, exports.permissions.CONFIGURE_TERRITORY,
    exports.permissions.VIEW_ACADEMY_MODULES, exports.permissions.VIEW_GUIDED_TOURS,
];
const REGIONAL_DIRECTOR_PERMISSIONS = [
    ...DIRECTOR_PERMISSIONS,
    exports.permissions.VIEW_OPERATIONS_QUEUE,
];
const OPERATIONS_PERMISSIONS = [
    exports.permissions.VIEW_ORGANIZATION_OWN, exports.permissions.VIEW_ORGANIZATION_TEAM, exports.permissions.VIEW_OPPORTUNITY_OWN,
    exports.permissions.VIEW_OPPORTUNITY_TEAM, exports.permissions.EDIT_OPPORTUNITY_POST_CW, exports.permissions.ADVANCE_STAGE_POST_CW,
    exports.permissions.VIEW_FULFILLMENT_STAGE, exports.permissions.UPDATE_FULFILLMENT_STAGE, exports.permissions.VIEW_PRODUCTION_DETAILS,
    exports.permissions.VIEW_OPERATIONS_QUEUE, exports.permissions.VIEW_ACADEMY_MODULES, exports.permissions.VIEW_GUIDED_TOURS,
];
exports.rolePermissions = {
    [roles_js_1.roles.ADMIN]: Object.values(exports.permissions),
    [roles_js_1.roles.REGIONAL_DIRECTOR]: REGIONAL_DIRECTOR_PERMISSIONS,
    [roles_js_1.roles.DIRECTOR]: DIRECTOR_PERMISSIONS,
    [roles_js_1.roles.TAE]: TAE_PERMISSIONS,
    [roles_js_1.roles.OPERATIONS]: OPERATIONS_PERMISSIONS,
};
function getPermissions(role) {
    const normalized = (0, roles_js_1.normalizeRole)(role);
    return normalized ? new Set(exports.rolePermissions[normalized]) : new Set();
}
//# sourceMappingURL=permissions.js.map