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
    const { assigned_rep_id, assigned_director_id, territory_id, created_by, updated_by } = organization;
    const name = normalizeName(organization.name);
    const state = normalizeState(organization.state);
    if (!name) {
        throw new Error('Organization name is required');
    }
    const client = await database_1.pool.connect();
    try {
        await client.query('BEGIN');
        const duplicateResult = await client.query('SELECT id FROM organizations WHERE lower(btrim(name)) = lower(btrim($1)) AND upper(btrim(state)) = upper(btrim($2)) LIMIT 1', [name, state]);
        if (duplicateResult.rows.length > 0) {
            throw new Error('Organization already exists for this name and state');
        }
        const orgResult = await client.query('INSERT INTO organizations (name, state, assigned_rep_id, assigned_director_id, territory_id, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [name, state, assigned_rep_id, assigned_director_id, territory_id, created_by, updated_by]);
        const createdOrganization = orgResult.rows[0];
        for (const channelType of REQUIRED_CHANNELS) {
            await client.query(`
        INSERT INTO opportunities (
          name,
          organization_id,
          sport,
          season,
          year,
          status,
          value,
          created_by,
          updated_by,
          stage,
          last_activity_date,
          assigned_rep_id,
          assigned_director_id,
          deal_type,
          channel_type
        ) VALUES ($1, $2, 'FOOTBALL', 'FALL', 2026, $3, $4, $5, $6, $7, current_timestamp, $8, $9, $10, $11)
        `, [
                `${name} - ${channelType}`,
                createdOrganization.id,
                'open',
                0.00,
                created_by,
                updated_by,
                auth_1.STAGES.LEAD,
                assigned_rep_id,
                assigned_director_id,
                channelType,
                channelType,
            ]);
        }
        await client.query('COMMIT');
        return createdOrganization;
    }
    catch (error) {
        await client.query('ROLLBACK');
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
    const { assigned_rep_id, assigned_director_id, territory_id, updated_by } = organization;
    if (!name) {
        throw new Error('Organization name is required');
    }
    try {
        const result = await database_1.pool.query('UPDATE organizations SET name = $1, state = $2, assigned_rep_id = $3, assigned_director_id = $4, territory_id = $5, updated_by = $6, updated_at = NOW() WHERE id = $7 RETURNING *', [name, state, assigned_rep_id, assigned_director_id, territory_id, updated_by, id]);
        return result.rows[0];
    }
    catch (error) {
        if (isUniqueViolation(error)) {
            throw new Error('Organization already exists for this name and state');
        }
        throw error;
    }
}
async function deleteOrganization(id) {
    await database_1.pool.query('DELETE FROM organizations WHERE id = $1', [id]);
}
//# sourceMappingURL=organizations.service.js.map