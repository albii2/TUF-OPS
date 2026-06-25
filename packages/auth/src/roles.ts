export const roles = {
  TAE: 'tae',
  DIRECTOR: 'director',
  OPERATIONS: 'operations',
} as const;

export const permissions = {
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
  VIEW_RENEWAL_PIPELINE: 'view_renewal_pipeline',
  INVITE_USER: 'invite_user',
  DEACTIVATE_USER: 'deactivate_user',
  CONFIGURE_TERRITORY: 'configure_territory',
  VIEW_ACADEMY_MODULES: 'view_academy_modules',
  VIEW_GUIDED_TOURS: 'view_guided_tours',
} as const;

type ObjectValues<T> = T[keyof T];

export type Role = ObjectValues<typeof roles>;
export type Permission = ObjectValues<typeof permissions>;

export const rolePermissions: Record<Role, readonly Permission[]> = {
  [roles.TAE]: [
    permissions.CREATE_ORGANIZATION, permissions.VIEW_ORGANIZATION_OWN, permissions.EDIT_ORGANIZATION_OWN,
    permissions.CREATE_OPPORTUNITY, permissions.VIEW_OPPORTUNITY_OWN, permissions.EDIT_OPPORTUNITY_PRE_CW,
    permissions.ADVANCE_STAGE_PRE_CW, permissions.VIEW_FULFILLMENT_STAGE, permissions.VIEW_PRODUCTION_DETAILS,
    permissions.VIEW_UNASSIGNED_LEADS, permissions.CLAIM_UNASSIGNED_LEAD, permissions.VIEW_PERSONAL_PIPELINE,
    permissions.VIEW_CERT_PROGRESS_OWN, permissions.VIEW_RELATIONSHIP_HISTORY, permissions.LOG_RELATIONSHIP_ACTIVITY,
    permissions.VIEW_RENEWAL_PIPELINE, permissions.VIEW_ACADEMY_MODULES, permissions.VIEW_GUIDED_TOURS,
  ],
  [roles.DIRECTOR]: [
    permissions.CREATE_ORGANIZATION, permissions.VIEW_ORGANIZATION_OWN, permissions.VIEW_ORGANIZATION_TEAM,
    permissions.EDIT_ORGANIZATION_OWN, permissions.CREATE_OPPORTUNITY, permissions.VIEW_OPPORTUNITY_OWN,
    permissions.VIEW_OPPORTUNITY_TEAM, permissions.EDIT_OPPORTUNITY_PRE_CW, permissions.ADVANCE_STAGE_PRE_CW,
    permissions.SET_CLOSED_WON, permissions.VIEW_FULFILLMENT_STAGE, permissions.VIEW_PRODUCTION_DETAILS,
    permissions.VIEW_UNASSIGNED_LEADS, permissions.CLAIM_UNASSIGNED_LEAD, permissions.ASSIGN_LEAD_SELF,
    permissions.ASSIGN_LEAD_TEAM, permissions.REBALANCE_LEADS, permissions.VIEW_PERSONAL_PIPELINE,
    permissions.VIEW_TEAM_PIPELINE, permissions.VIEW_TERRITORY_HEALTH, permissions.VIEW_CERT_PROGRESS_OWN,
    permissions.VIEW_CERT_PROGRESS_TEAM, permissions.VIEW_RELATIONSHIP_HISTORY, permissions.LOG_RELATIONSHIP_ACTIVITY, permissions.VIEW_RENEWAL_PIPELINE,
    permissions.INVITE_USER, permissions.DEACTIVATE_USER, permissions.CONFIGURE_TERRITORY,
    permissions.VIEW_ACADEMY_MODULES, permissions.VIEW_GUIDED_TOURS,
  ],
  [roles.OPERATIONS]: [
    permissions.VIEW_ORGANIZATION_OWN, permissions.VIEW_ORGANIZATION_TEAM, permissions.VIEW_OPPORTUNITY_OWN,
    permissions.VIEW_OPPORTUNITY_TEAM, permissions.EDIT_OPPORTUNITY_POST_CW, permissions.ADVANCE_STAGE_POST_CW,
    permissions.VIEW_FULFILLMENT_STAGE, permissions.UPDATE_FULFILLMENT_STAGE, permissions.VIEW_PRODUCTION_DETAILS,
    permissions.VIEW_OPERATIONS_QUEUE, permissions.VIEW_ACADEMY_MODULES, permissions.VIEW_GUIDED_TOURS,
  ],
};

export function normalizeRole(role: unknown): Role | null {
  if (role === roles.TAE || role === 'REP') return roles.TAE;
  if (role === roles.DIRECTOR || role === 'DIRECTOR') return roles.DIRECTOR;
  if (role === roles.OPERATIONS || role === 'OPERATIONS' || role === 'OPS' || role === 'REGIONAL_DIRECTOR') return roles.OPERATIONS;
  return null;
}

export function getPermissions(role: unknown): Set<Permission> {
  const normalized = normalizeRole(role);
  return normalized ? new Set(rolePermissions[normalized]) : new Set();
}
