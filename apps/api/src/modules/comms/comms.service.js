"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createComm = createComm;
exports.getComms = getComms;
exports.getComm = getComm;
exports.updateComm = updateComm;
exports.deleteComm = deleteComm;
exports.getScheduledComms = getScheduledComms;
exports.getUpcomingComms = getUpcomingComms;
const database_1 = require("@packages/database");
async function createComm(data) {
    const result = await database_1.pool.query(`INSERT INTO leadership_comms (subject, recipient, recipient_role, body, status, scheduled_for, tags, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`, [data.subject, data.recipient, data.recipient_role || '', data.body, data.status || 'draft',
        data.scheduled_for || null, data.tags || [], data.notes || '', data.created_by]);
    return result.rows[0];
}
async function getComms(filters) {
    let query = 'SELECT * FROM leadership_comms WHERE 1=1';
    const params = [];
    let i = 1;
    if (filters?.status) {
        query += ` AND status = $${i++}`;
        params.push(filters.status);
    }
    if (filters?.recipient) {
        query += ` AND recipient = $${i++}`;
        params.push(filters.recipient);
    }
    if (filters?.scheduled_before) {
        query += ` AND scheduled_for <= $${i++}`;
        params.push(filters.scheduled_before);
    }
    query += ' ORDER BY CASE WHEN scheduled_for IS NULL THEN 1 ELSE 0 END, scheduled_for ASC, created_at DESC';
    const result = await database_1.pool.query(query, params);
    return result.rows;
}
async function getComm(id) {
    const result = await database_1.pool.query('SELECT * FROM leadership_comms WHERE id = $1', [id]);
    return result.rows[0] || null;
}
async function updateComm(id, data) {
    const sets = [];
    const params = [];
    let i = 1;
    for (const [key, value] of Object.entries(data)) {
        if (key === 'updated_by')
            continue;
        if (value !== undefined && value !== null) {
            sets.push(`${key} = $${i++}`);
            params.push(value);
        }
    }
    if (sets.length === 0)
        return getComm(id);
    sets.push(`updated_at = NOW()`);
    sets.push(`updated_by = $${i++}`);
    params.push(data.updated_by);
    params.push(id);
    const result = await database_1.pool.query(`UPDATE leadership_comms SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return result.rows[0] || null;
}
async function deleteComm(id) {
    const result = await database_1.pool.query('DELETE FROM leadership_comms WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
}
async function getScheduledComms() {
    const result = await database_1.pool.query(`SELECT * FROM leadership_comms 
     WHERE status = 'scheduled' AND scheduled_for <= NOW()
     ORDER BY scheduled_for ASC LIMIT 10`);
    return result.rows;
}
async function getUpcomingComms(hours = 24) {
    const result = await database_1.pool.query(`SELECT * FROM leadership_comms 
     WHERE status = 'scheduled' 
       AND scheduled_for > NOW() 
       AND scheduled_for <= NOW() + INTERVAL '1 hour' * $1
     ORDER BY scheduled_for ASC`, [hours]);
    return result.rows;
}
//# sourceMappingURL=comms.service.js.map