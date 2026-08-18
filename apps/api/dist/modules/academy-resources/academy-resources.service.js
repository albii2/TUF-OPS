"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listResources = listResources;
exports.getResourceBySlug = getResourceBySlug;
const database_1 = require("@packages/database");
async function listResources() {
    const result = await database_1.pool.query(`SELECT id, slug, title, kind, body_markdown, external_url, sort_order, is_active, updated_at
     FROM academy_resources
     WHERE is_active = true
     ORDER BY sort_order ASC, title ASC`);
    return result.rows;
}
async function getResourceBySlug(slug) {
    const result = await database_1.pool.query(`SELECT id, slug, title, kind, body_markdown, external_url, sort_order, is_active, updated_at
     FROM academy_resources
     WHERE slug = $1 AND is_active = true`, [slug]);
    return result.rows[0] || null;
}
//# sourceMappingURL=academy-resources.service.js.map