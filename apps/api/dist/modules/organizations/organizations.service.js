"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrganization = createOrganization;
exports.getOrganizations = getOrganizations;
exports.updateOrganization = updateOrganization;
exports.deleteOrganization = deleteOrganization;
const database_1 = require("@packages/database");
const opportunities_interface_1 = require("../opportunities/opportunities.interface");
const REQUIRED_CHANNELS = [
    opportunities_interface_1.OpportunityChannelType.UNIFORM,
    opportunities_interface_1.OpportunityChannelType.TRAVEL_GEAR,
    opportunities_interface_1.OpportunityChannelType.TEAM_STORE,
    opportunities_interface_1.OpportunityChannelType.LETTERMAN,
];
async function createOrganization(organization) {
    const { name, assigned_rep_id, assigned_director_id, territory_id, created_by, updated_by } = organization;
    const client = await database_1.pool.connect();
    try {
        await client.query('BEGIN');
        const orgResult = await client.query('INSERT INTO organizations (name, assigned_rep_id, assigned_director_id, territory_id, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [name, assigned_rep_id, assigned_director_id, territory_id, created_by, updated_by]);
        const createdOrganization = orgResult.rows[0];
        for (const channelType of REQUIRED_CHANNELS) {
            await client.query(`
        INSERT INTO opportunities (
          name,
          organization_id,
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, current_timestamp, $8, $9, $10, $11)
        ON CONFLICT (organization_id, channel_type) WHERE channel_type IS NOT NULL DO NOTHING
        `, [
                `${name} - ${channelType}`,
                createdOrganization.id,
                'open',
                0.00,
                created_by,
                updated_by,
                opportunities_interface_1.OpportunityStage.NOT_STARTED,
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
async function updateOrganization(id, organization) {
    const { name, assigned_rep_id, assigned_director_id, territory_id, updated_by } = organization;
    const result = await database_1.pool.query('UPDATE organizations SET name = $1, assigned_rep_id = $2, assigned_director_id = $3, territory_id = $4, updated_by = $5, updated_at = NOW() WHERE id = $6 RETURNING *', [name, assigned_rep_id, assigned_director_id, territory_id, updated_by, id]);
    return result.rows[0];
}
async function deleteOrganization(id) {
    await database_1.pool.query('DELETE FROM organizations WHERE id = $1', [id]);
}
//# sourceMappingURL=organizations.service.js.map