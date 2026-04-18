import { pool } from '@packages/database';

export async function createOrganization(organization: any) {
  const { name, assigned_rep_id, assigned_director_id, territory_id, created_by, updated_by } = organization;
  const result = await pool.query(
    'INSERT INTO organizations (name, assigned_rep_id, assigned_director_id, territory_id, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [name, assigned_rep_id, assigned_director_id, territory_id, created_by, updated_by]
  );
  return result.rows[0];
}

export async function getOrganizations() {
  const result = await pool.query('SELECT * FROM organizations');
  return result.rows;
}

export async function updateOrganization(id: string, organization: any) {
  const { name, assigned_rep_id, assigned_director_id, territory_id, updated_by } = organization;
  const result = await pool.query(
    'UPDATE organizations SET name = $1, assigned_rep_id = $2, assigned_director_id = $3, territory_id = $4, updated_by = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
    [name, assigned_rep_id, assigned_director_id, territory_id, updated_by, id]
  );
  return result.rows[0];
}

export async function deleteOrganization(id: string) {
  await pool.query('DELETE FROM organizations WHERE id = $1', [id]);
}
