"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrganization = createOrganization;
exports.getOrganizations = getOrganizations;
exports.updateOrganization = updateOrganization;
exports.deleteOrganization = deleteOrganization;
const database_1 = require("@packages/database");
async function createOrganization(organization) {
    const { name, assigned_rep_id, assigned_director_id, territory_id, created_by, updated_by } = organization;
    const result = await database_1.pool.query('INSERT INTO organizations (name, assigned_rep_id, assigned_director_id, territory_id, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [name, assigned_rep_id, assigned_director_id, territory_id, created_by, updated_by]);
    return result.rows[0];
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