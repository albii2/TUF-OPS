"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIntakeItem = createIntakeItem;
exports.getIntakeItems = getIntakeItems;
exports.getIntakeItem = getIntakeItem;
exports.updateIntakeItem = updateIntakeItem;
exports.deleteIntakeItem = deleteIntakeItem;
exports.getOpenDecisions = getOpenDecisions;
const database_1 = require("@packages/database");
async function createIntakeItem(data) {
    const result = await database_1.pool.query(`INSERT INTO executive_intake (title, description, source, priority, owner, tags, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`, [data.title, data.description || '', data.source || 'other', data.priority || 'medium',
        data.owner || '', data.tags || [], data.created_by]);
    return result.rows[0];
}
async function getIntakeItems(filters) {
    let query = 'SELECT * FROM executive_intake WHERE 1=1';
    const params = [];
    let paramIdx = 1;
    if (filters?.status) {
        query += ` AND status = $${paramIdx++}`;
        params.push(filters.status);
    }
    if (filters?.priority) {
        query += ` AND priority = $${paramIdx++}`;
        params.push(filters.priority);
    }
    if (filters?.owner) {
        query += ` AND owner = $${paramIdx++}`;
        params.push(filters.owner);
    }
    if (filters?.source) {
        query += ` AND source = $${paramIdx++}`;
        params.push(filters.source);
    }
    query += ' ORDER BY CASE priority WHEN \'critical\' THEN 0 WHEN \'high\' THEN 1 WHEN \'medium\' THEN 2 ELSE 3 END, created_at DESC';
    const result = await database_1.pool.query(query, params);
    return result.rows;
}
async function getIntakeItem(id) {
    const result = await database_1.pool.query('SELECT * FROM executive_intake WHERE id = $1', [id]);
    return result.rows[0] || null;
}
async function updateIntakeItem(id, data) {
    const sets = [];
    const params = [];
    let paramIdx = 1;
    for (const [key, value] of Object.entries(data)) {
        if (key === 'updated_by')
            continue;
        if (value !== undefined) {
            sets.push(`${key} = $${paramIdx++}`);
            params.push(value);
        }
    }
    if (sets.length === 0)
        return getIntakeItem(id);
    sets.push(`updated_at = NOW()`);
    sets.push(`updated_by = $${paramIdx}`);
    params.push(data.updated_by);
    params.push(id);
    const result = await database_1.pool.query(`UPDATE executive_intake SET ${sets.join(', ')} WHERE id = $${paramIdx} RETURNING *`, params);
    return result.rows[0] || null;
}
async function deleteIntakeItem(id) {
    const result = await database_1.pool.query('DELETE FROM executive_intake WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
}
async function getOpenDecisions() {
    const result = await database_1.pool.query(`SELECT * FROM executive_intake 
     WHERE status = 'open' AND (priority = 'critical' OR priority = 'high')
     ORDER BY CASE priority WHEN 'critical' THEN 0 ELSE 1 END, created_at DESC`);
    return result.rows;
}
//# sourceMappingURL=intake.service.js.map