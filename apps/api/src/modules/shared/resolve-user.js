"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveUserId = resolveUserId;
const database_1 = require("@packages/database");
/**
 * Resolve a user name string to a numeric user ID.
 * Handles common display formats: "Josh Hoffman", "Josh", "Hoffman", etc.
 * Returns null for empty names or "Unassigned".
 */
async function resolveUserId(name) {
    if (!name || name === 'Unassigned')
        return null;
    const result = await database_1.pool.query('SELECT id FROM users WHERE name ILIKE $1 LIMIT 1', [name]);
    return result.rows[0]?.id ?? null;
}
//# sourceMappingURL=resolve-user.js.map