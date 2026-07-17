"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createActivity = createActivity;
exports.getActivitiesByOpportunity = getActivitiesByOpportunity;
exports.getActivitiesByOrganization = getActivitiesByOrganization;
exports.getAllActivities = getAllActivities;
exports.markActivityComplete = markActivityComplete;
exports.createRepActivity = createRepActivity;
exports.getRepActivitiesByOpportunity = getRepActivitiesByOpportunity;
const database_1 = require("@packages/database");
async function createActivity(activity) {
    const { type, organization_id, opportunity_id, description, created_by, due_date, completed } = activity;
    if (!type || !description?.trim() || !organization_id || !created_by) {
        throw new Error('type, organization_id, description, and created_by are required');
    }
    const client = await database_1.pool.connect();
    try {
        await client.query('BEGIN');
        const organizationResult = await client.query('SELECT id FROM organizations WHERE id = $1', [organization_id]);
        if (organizationResult.rows.length === 0) {
            throw new Error('Activity organization does not exist');
        }
        if (opportunity_id) {
            const opportunityResult = await client.query('SELECT id FROM opportunities WHERE id = $1 AND organization_id = $2', [opportunity_id, organization_id]);
            if (opportunityResult.rows.length === 0) {
                throw new Error('Activity opportunity does not exist for this organization');
            }
        }
        const result = await client.query('INSERT INTO activities (type, organization_id, opportunity_id, description, created_by, due_date, completed) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [type, organization_id, opportunity_id ?? null, description.trim(), created_by, due_date ?? null, completed || false]);
        const created = result.rows[0];
        await client.query('INSERT INTO activity_audit_history (activity_id, organization_id, opportunity_id, action, created_by) VALUES ($1, $2, $3, $4, $5)', [created.id, created.organization_id, created.opportunity_id, 'CREATED', created_by]);
        if (opportunity_id) {
            await client.query('UPDATE opportunities SET last_activity_date = $1, updated_at = $1 WHERE id = $2', [new Date(), opportunity_id]);
        }
        await client.query('COMMIT');
        return created;
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
    const result = await database_1.pool.query('SELECT * FROM activities WHERE organization_id = $1 ORDER BY timestamp DESC', [organizationId]);
    return result.rows;
}
async function getAllActivities(limit = 100) {
    const result = await database_1.pool.query('SELECT * FROM activities ORDER BY timestamp DESC LIMIT $1', [limit]);
    return result.rows;
}
async function markActivityComplete(activityId, completedBy) {
    const client = await database_1.pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query('UPDATE activities SET completed = true, updated_at = current_timestamp WHERE id = $1 RETURNING *', [activityId]);
        if (result.rows.length === 0) {
            throw new Error('Activity not found');
        }
        const activity = result.rows[0];
        await client.query('INSERT INTO activity_audit_history (activity_id, organization_id, opportunity_id, action, created_by) VALUES ($1, $2, $3, $4, $5)', [activity.id, activity.organization_id, activity.opportunity_id, 'COMPLETED', completedBy]);
        if (activity.opportunity_id) {
            await client.query('UPDATE opportunities SET last_activity_date = current_timestamp, updated_at = current_timestamp WHERE id = $1', [activity.opportunity_id]);
        }
        await client.query('COMMIT');
        return activity;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
async function createRepActivity(data) {
    const validTypes = ['call', 'email', 'meeting', 'note'];
    if (!validTypes.includes(data.activity_type)) {
        throw new Error(`Invalid activity_type. Must be one of: ${validTypes.join(', ')}`);
    }
    if (!data.opportunity_id) {
        throw new Error('opportunity_id is required');
    }
    const result = await database_1.pool.query(`INSERT INTO rep_activities (user_id, opportunity_id, activity_type, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`, [data.user_id, data.opportunity_id, data.activity_type, data.notes || null]);
    const record = result.rows[0];
    const userResult = await database_1.pool.query('SELECT name as full_name, email FROM users WHERE id = $1', [data.user_id]);
    return {
        ...record,
        user_full_name: userResult.rows[0]?.full_name || null,
        user_email: userResult.rows[0]?.email || null,
    };
}
async function getRepActivitiesByOpportunity(opportunityId) {
    const result = await database_1.pool.query(`SELECT ra.*, u.name as user_full_name, u.email as user_email
     FROM rep_activities ra
     JOIN users u ON ra.user_id = u.id
     WHERE ra.opportunity_id = $1
     ORDER BY ra.created_at DESC`, [opportunityId]);
    return result.rows;
}
//# sourceMappingURL=activities.service.js.map