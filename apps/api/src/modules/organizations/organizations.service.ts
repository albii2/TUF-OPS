import { pool } from '@packages/database';

export async function createOrganization(organization: any) {
  const { name, owner_id, created_by, updated_by } = organization;
  const result = await pool.query(
    'INSERT INTO organizations (name, owner_id, created_by, updated_by) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, owner_id, created_by, updated_by]
  );
  return result.rows[0];
}

export async function getOrganizations() {
  const result = await pool.query('SELECT * FROM organizations');
  return result.rows;
}
