import { pool } from '@packages/database';

export interface LeadershipComm {
  id: number;
  subject: string;
  recipient: string;
  recipient_role?: string;
  body: string;
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  scheduled_for?: string;
  sent_at?: string;
  delivery_channel: string;
  tags: string[];
  ai_draft?: string;
  notes?: string;
  created_by: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export async function createComm(data: {
  subject: string;
  recipient: string;
  recipient_role?: string;
  body: string;
  status?: string;
  scheduled_for?: string;
  tags?: string[];
  notes?: string;
  created_by: number;
}): Promise<LeadershipComm> {
  const result = await pool.query(
    `INSERT INTO leadership_comms (subject, recipient, recipient_role, body, status, scheduled_for, tags, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [data.subject, data.recipient, data.recipient_role || '', data.body, data.status || 'draft',
     data.scheduled_for || null, data.tags || [], data.notes || '', data.created_by]
  );
  return result.rows[0];
}

export async function getComms(filters?: {
  status?: string;
  recipient?: string;
  scheduled_before?: string;
}): Promise<LeadershipComm[]> {
  let query = 'SELECT * FROM leadership_comms WHERE 1=1';
  const params: any[] = [];
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
  const result = await pool.query(query, params);
  return result.rows;
}

export async function getComm(id: number): Promise<LeadershipComm | null> {
  const result = await pool.query('SELECT * FROM leadership_comms WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function updateComm(id: number, data: {
  subject?: string;
  recipient?: string;
  recipient_role?: string;
  body?: string;
  status?: string;
  scheduled_for?: string;
  notes?: string;
  tags?: string[];
  updated_by: number;
}): Promise<LeadershipComm | null> {
  const sets: string[] = [];
  const params: any[] = [];
  let i = 1;

  for (const [key, value] of Object.entries(data)) {
    if (key === 'updated_by') continue;
    if (value !== undefined && value !== null) {
      sets.push(`${key} = $${i++}`);
      params.push(value);
    }
  }

  if (sets.length === 0) return getComm(id);

  sets.push(`updated_at = NOW()`);
  sets.push(`updated_by = $${i++}`);
  params.push(data.updated_by);
  params.push(id);

  const result = await pool.query(
    `UPDATE leadership_comms SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
    params
  );
  return result.rows[0] || null;
}

export async function deleteComm(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM leadership_comms WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function getScheduledComms(): Promise<LeadershipComm[]> {
  const result = await pool.query(
    `SELECT * FROM leadership_comms 
     WHERE status = 'scheduled' AND scheduled_for <= NOW()
     ORDER BY scheduled_for ASC LIMIT 10`
  );
  return result.rows;
}

export async function getUpcomingComms(hours: number = 24): Promise<LeadershipComm[]> {
  const result = await pool.query(
    `SELECT * FROM leadership_comms 
     WHERE status = 'scheduled' 
       AND scheduled_for > NOW() 
       AND scheduled_for <= NOW() + INTERVAL '1 hour' * $1
     ORDER BY scheduled_for ASC`,
    [hours]
  );
  return result.rows;
}
