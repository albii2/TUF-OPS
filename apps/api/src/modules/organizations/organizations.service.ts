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

export async function updateOrganization(id: string, organization: any) {
  const { name, owner_id, updated_by } = organization;
  const result = await pool.query(
    'UPDATE organizations SET name = $1, owner_id = $2, updated_by = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
    [name, owner_id, updated_by, id]
  );
  return result.rows[0];
}

export async function deleteOrganization(id: string) {
  await pool.query('DELETE FROM organizations WHERE id = $1', [id]);
}
