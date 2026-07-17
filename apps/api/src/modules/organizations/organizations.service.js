"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrganization = createOrganization;
exports.getOrganizations = getOrganizations;
exports.getOrganizationById = getOrganizationById;
exports.updateOrganization = updateOrganization;
exports.deleteOrganization = deleteOrganization;
const database_1 = require("@packages/database");
const opportunities_interface_1 = require("../opportunities/opportunities.interface");
const auth_1 = require("@packages/auth");
const resolve_user_1 = require("../shared/resolve-user");
const audit_log_1 = require("../shared/audit-log");
const REQUIRED_CHANNELS = [
    opportunities_interface_1.OpportunityChannelType.UNIFORM,
    opportunities_interface_1.OpportunityChannelType.TRAVEL_GEAR,
    opportunities_interface_1.OpportunityChannelType.TEAM_STORE,
    opportunities_interface_1.OpportunityChannelType.LETTERMAN,
];
function normalizeName(value) {
    return typeof value === 'string' ? value.trim() : '';
}
function normalizeState(value) {
    return typeof value === 'string' ? value.trim().toUpperCase() : '';
}
function isUniqueViolation(error) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}
async function createOrganization(organization) {
    // Accept both frontend camelCase names and backend snake_case IDs
    const name = normalizeName(organization.name);
    const state = normalizeState(organization.state);
    if (!name) {
        throw new Error('Organization name is required');
    }
    // Resolve rep/director names to IDs if needed
    const repName = organization.assignedRep || organization.assigned_rep_name;
    const directorName = organization.assignedDirector || organization.assigned_director_name;
    const assigned_rep_id = organization.assigned_rep_id ?? (repName ? await (0, resolve_user_1.resolveUserId)(repName) : null);
    const assigned_director_id = organization.assigned_director_id ?? (directorName ? await (0, resolve_user_1.resolveUserId)(directorName) : null);
    const territory_id = organization.territory_id ?? organization.territoryId ?? null;
    const created_by = organization.created_by ?? organization.createdBy ?? assigned_rep_id ?? 1;
    const updated_by = organization.updated_by ?? organization.updatedBy ?? created_by;
    const client = await database_1.pool.connect();
    try {
        // Insert organization immediately — don't wait for auto-opportunities
        await client.query('BEGIN');
        const orgResult = await client.query('INSERT INTO organizations (name, state, assigned_rep_id, assigned_director_id, territory_id, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [name, state, assigned_rep_id, assigned_director_id, territory_id, created_by, updated_by]);
        const createdOrganization = orgResult.rows[0];
        await client.query('COMMIT');
        // Audit log
        (0, audit_log_1.auditLog)({
            action: 'CREATE',
            user_id: created_by,
            resource_type: 'organization',
            resource_id: createdOrganization.id,
            metadata: { name, state },
        }).catch(() => { });
        // Fire-and-forget: create auto-opportunities in the background
        // Don't block the response — org is saved, opps will populate async
        const oppCreatedBy = created_by;
        const oppUpdatedBy = updated_by;
        const oppRepId = assigned_rep_id;
        const oppDirId = assigned_director_id;
        const oppOrgId = createdOrganization.id;
        const oppName = name;
        setImmediate(async () => {
            try {
                for (const channelType of REQUIRED_CHANNELS) {
                    await database_1.pool.query(`INSERT INTO opportunities (name, organization_id, sport, season, year, status, value, created_by, updated_by, stage, last_activity_date, assigned_rep_id, assigned_director_id, deal_type, channel_type)
             VALUES ($1, $2, 'FOOTBALL', 'FALL', 2026, $3, $4, $5, $6, $7, current_timestamp, $8, $9, $10, $11)`, [`${oppName} - ${channelType}`, oppOrgId, 'open', 0.00, oppCreatedBy, oppUpdatedBy, auth_1.STAGES.LEAD, oppRepId, oppDirId, channelType, channelType]);
                }
            }
            catch (oppError) {
                console.error('createOrganization: auto-opportunity creation failed:', oppError);
            }
        });
        return createdOrganization;
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('createOrganization DB error:', error, 'Stack:', error?.stack);
        if (isUniqueViolation(error)) {
            throw new Error('Organization already exists for this name and state');
        }
        throw error;
    }
    finally {
        client.release();
    }
}
async function getOrganizations() {
    const result = await database_1.pool.query('SELECT * FROM organizations');
    return result.rows;
}
async function getOrganizationById(id) {
    const result = await database_1.pool.query('SELECT * FROM organizations WHERE id = $1', [id]);
    return result.rows[0] || null;
}
async function updateOrganization(id, organization) {
    const name = normalizeName(organization.name);
    const state = normalizeState(organization.state);
    if (!name) {
        throw new Error('Organization name is required');
    }
    // Resolve rep/director names to IDs — frontend sends camelCase names,
    // backend expects snake_case numeric IDs
    const repName = organization.assignedRep || organization.assigned_rep_name;
    const directorName = organization.assignedDirector || organization.assigned_director_name;
    const assigned_rep_id = organization.assigned_rep_id ?? (repName ? await (0, resolve_user_1.resolveUserId)(repName) : null);
    const assigned_director_id = organization.assigned_director_id ?? (directorName ? await (0, resolve_user_1.resolveUserId)(directorName) : null);
    const territory_id = organization.territory_id ?? organization.territoryId ?? null;
    const updated_by = organization.updated_by ?? organization.updatedBy ?? assigned_rep_id ?? 1;
    try {
        const result = await database_1.pool.query('UPDATE organizations SET name = $1, state = $2, assigned_rep_id = $3, assigned_director_id = $4, territory_id = $5, updated_by = $6, updated_at = NOW() WHERE id = $7 RETURNING *', [name, state, assigned_rep_id, assigned_director_id, territory_id, updated_by, id]);
        const updatedOrg = result.rows[0];
        (0, audit_log_1.auditLog)({
            action: 'UPDATE',
            user_id: updated_by,
            resource_type: 'organization',
            resource_id: id,
            metadata: { name, state },
        }).catch(() => { });
        return updatedOrg;
    }
    catch (error) {
        if (isUniqueViolation(error)) {
            throw new Error('Organization already exists for this name and state');
        }
        throw error;
    }
}
async function deleteOrganization(id, userId) {
    await database_1.pool.query('DELETE FROM organizations WHERE id = $1', [id]);
    (0, audit_log_1.auditLog)({
        action: 'DELETE',
        user_id: userId ?? null,
        resource_type: 'organization',
        resource_id: id,
    }).catch(() => { });
}
//# sourceMappingURL=organizations.service.js.map