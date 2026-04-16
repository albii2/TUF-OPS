"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrganization = createOrganization;
exports.getOrganizations = getOrganizations;
const db_1 = require("@packages/database/src/db");
async function createOrganization(organization) {
    const { name, owner_id, created_by, updated_by } = organization;
    const result = await db_1.pool.query('INSERT INTO organizations (name, owner_id, created_by, updated_by) VALUES ($1, $2, $3, $4) RETURNING *', [name, owner_id, created_by, updated_by]);
    return result.rows[0];
}
async function getOrganizations() {
    const result = await db_1.pool.query('SELECT * FROM organizations');
    return result.rows;
}
