"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createActivity = createActivity;
exports.getActivitiesByOpportunity = getActivitiesByOpportunity;
exports.getActivitiesByOrganization = getActivitiesByOrganization;
exports.markActivityComplete = markActivityComplete;
const database_1 = require("@packages/database");
async function createActivity(activity) {
    const { type, organization_id, opportunity_id, description, created_by, due_date, completed } = activity;
    const client = await database_1.pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query('INSERT INTO activities (type, organization_id, opportunity_id, description, created_by, due_date, completed) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [type, organization_id, opportunity_id, description, created_by, due_date, completed || false]);
        if (opportunity_id) {
            await client.query('UPDATE opportunities SET last_activity_date = $1, updated_at = current_timestamp WHERE id = $2', [new Date(), opportunity_id]);
        }
        await client.query('COMMIT');
        return result.rows[0];
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
async function getActivitiesByOpportunity(opportunityId) {
    const result = await database_1.pool.query('SELECT * FROM activities WHERE opportunity_id = $1', [opportunityId]);
    return result.rows;
}
async function getActivitiesByOrganization(organizationId) {
    const result = await database_1.pool.query('SELECT * FROM activities WHERE organization_id = $1', [organizationId]);
    return result.rows;
}
async function markActivityComplete(activityId, completedBy) {
    const result = await database_1.pool.query('UPDATE activities SET completed = true, updated_at = current_timestamp WHERE id = $1 RETURNING *', [activityId]);
    if (result.rows.length === 0) {
        throw new Error('Activity not found');
    }
    return result.rows[0];
}
//# sourceMappingURL=activities.service.js.map