import { pool } from '@packages/database';

export interface IntakeItem {
  id: number;
  title: string;
  description: string;
  source: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'review' | 'approved' | 'closed';
  owner: string;
  next_action: string;
  ai_summary: string;
  ai_draft: string;
  tags: string[];
  created_by: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export interface IntakeComment {
  id: number;
  intake_id: number;
  content: string;
  author: string;
  created_at: string;
}

export interface IntakeAuditEntry {
  id: number;
  intake_id: number;
  action: string;
  changed_by: string;
  details: any;
  created_at: string;
}

export async function createIntakeItem(data: {
  title: string;
  description?: string;
  source?: string;
  priority?: string;
  owner?: string;
  tags?: string[];
  created_by: number;
}): Promise<IntakeItem> {
  const result = await pool.query(
    `INSERT INTO executive_intake (title, description, source, priority, owner, tags, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [data.title, data.description || '', data.source || 'other', data.priority || 'medium',
     data.owner || '', data.tags || [], data.created_by]
  );
  return result.rows[0];
}

export async function getIntakeItems(filters?: {
  status?: string;
  priority?: string;
  owner?: string;
  source?: string;
}): Promise<IntakeItem[]> {
  let query = 'SELECT * FROM executive_intake WHERE 1=1';
  const params: any[] = [];
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
  const result = await pool.query(query, params);
  return result.rows;
}

export async function getIntakeItem(id: number): Promise<IntakeItem | null> {
  const result = await pool.query('SELECT * FROM executive_intake WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function updateIntakeItem(id: number, data: {
  title?: string;
  description?: string;
  source?: string;
  priority?: string;
  status?: string;
  owner?: string;
  next_action?: string;
  ai_summary?: string;
  ai_draft?: string;
  tags?: string[];
  updated_by: number;
}): Promise<IntakeItem | null> {
  const sets: string[] = [];
  const params: any[] = [];
  let paramIdx = 1;

  for (const [key, value] of Object.entries(data)) {
    if (key === 'updated_by') continue;
    if (value !== undefined) {
      sets.push(`${key} = $${paramIdx++}`);
      params.push(value);
    }
  }

  if (sets.length === 0) return getIntakeItem(id);

  sets.push(`updated_at = NOW()`);
  sets.push(`updated_by = $${paramIdx}`);
  params.push(data.updated_by);

  params.push(id);
  const result = await pool.query(
    `UPDATE executive_intake SET ${sets.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
    params
  );
  return result.rows[0] || null;
}

export async function deleteIntakeItem(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM executive_intake WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function getOpenDecisions(): Promise<IntakeItem[]> {
  const result = await pool.query(
    `SELECT * FROM executive_intake 
     WHERE status = 'open' AND (priority = 'critical' OR priority = 'high')
     ORDER BY CASE priority WHEN 'critical' THEN 0 ELSE 1 END, created_at DESC`
  );
  return result.rows;
}
