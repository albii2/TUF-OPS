"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listWorkItems = listWorkItems;
exports.getWorkItemById = getWorkItemById;
exports.createWorkItem = createWorkItem;
exports.updateWorkItem = updateWorkItem;
exports.updateWorkItemStatus = updateWorkItemStatus;
const database_1 = require("@packages/database");
async function listWorkItems(query) {
    const conditions = [];
    const values = [];
    let paramIndex = 1;
    if (query.owner_id !== undefined) {
        conditions.push(`owner_id = $${paramIndex++}`);
        values.push(query.owner_id);
    }
    if (query.status) {
        conditions.push(`status = $${paramIndex++}`);
        values.push(query.status);
    }
    if (query.source) {
        conditions.push(`source = $${paramIndex++}`);
        values.push(query.source);
    }
    if (query.priority) {
        conditions.push(`priority = $${paramIndex++}`);
        values.push(query.priority);
    }
    if (query.linked_entity_type) {
        conditions.push(`linked_entity_type = $${paramIndex++}`);
        values.push(query.linked_entity_type);
    }
    if (query.linked_entity_id !== undefined) {
        conditions.push(`linked_entity_id = $${paramIndex++}`);
        values.push(query.linked_entity_id);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await database_1.pool.query(`SELECT * FROM work_items ${where} ORDER BY priority = 'high' DESC, priority = 'critical' DESC, created_at DESC`, values);
    return result.rows;
}
async function getWorkItemById(id) {
    const result = await database_1.pool.query('SELECT * FROM work_items WHERE id = $1', [id]);
    return result.rows[0] || null;
}
async function createWorkItem(input) {
    const result = await database_1.pool.query(`INSERT INTO work_items (
      owner_id, source, item_type, priority, title, description, due_at, status,
      linked_entity_type, linked_entity_id, suggested_action, ai_summary
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`, [
        input.owner_id ?? null,
        input.source,
        input.item_type,
        input.priority || 'medium',
        input.title,
        input.description ?? null,
        input.due_at ?? null,
        input.status || 'open',
        input.linked_entity_type ?? null,
        input.linked_entity_id ?? null,
        input.suggested_action ?? null,
        input.ai_summary ?? null,
    ]);
    return result.rows[0];
}
async function updateWorkItem(id, input) {
    const current = await getWorkItemById(id);
    if (!current)
        return null;
    const sets = [];
    const values = [];
    let paramIndex = 1;
    const fields = [
        'owner_id', 'source', 'item_type', 'priority', 'title', 'description',
        'due_at', 'status', 'linked_entity_type', 'linked_entity_id',
        'suggested_action', 'ai_summary',
    ];
    for (const field of fields) {
        if (input[field] !== undefined) {
            sets.push(`${field} = $${paramIndex++}`);
            values.push(input[field]);
        }
    }
    if (sets.length === 0)
        return current;
    sets.push(`updated_at = NOW()`);
    const result = await database_1.pool.query(`UPDATE work_items SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`, [...values, id]);
    return result.rows[0] || null;
}
async function updateWorkItemStatus(id, input) {
    const result = await database_1.pool.query(`UPDATE work_items SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [input.status, id]);
    return result.rows[0] || null;
}
//# sourceMappingURL=work-items.service.js.map