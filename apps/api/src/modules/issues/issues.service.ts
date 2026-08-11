import { pool } from '@packages/database';
import type {
  Issue,
  CreateIssueInput,
  UpdateIssueInput,
  UpdateIssueStatusInput,
  ListIssuesQuery,
  IssueStatus,
} from './issues.interface';

export async function listIssues(query: ListIssuesQuery): Promise<Issue[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (query.status) {
    conditions.push(`status = $${paramIndex++}`);
    values.push(query.status);
  }
  if (query.severity) {
    conditions.push(`severity = $${paramIndex++}`);
    values.push(query.severity);
  }
  if (query.category) {
    conditions.push(`category = $${paramIndex++}`);
    values.push(query.category);
  }
  if (query.submitted_by !== undefined) {
    conditions.push(`submitted_by = $${paramIndex++}`);
    values.push(query.submitted_by);
  }
  if (query.assigned_to !== undefined) {
    conditions.push(`assigned_to = $${paramIndex++}`);
    values.push(query.assigned_to);
  }
  if (query.is_blocking !== undefined) {
    conditions.push(`is_blocking = $${paramIndex++}`);
    values.push(query.is_blocking);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query<Issue>(
    `SELECT * FROM issues ${where} ORDER BY 
       CASE severity 
         WHEN 'critical' THEN 0 
         WHEN 'high' THEN 1 
         WHEN 'medium' THEN 2 
         ELSE 3 
       END, 
       is_blocking DESC, 
       created_at DESC`,
    values,
  );
  return result.rows;
}

export async function getIssueById(id: number): Promise<Issue | null> {
  const result = await pool.query<Issue>('SELECT * FROM issues WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function createIssue(
  input: CreateIssueInput,
  submittedBy: number,
): Promise<Issue> {
  const result = await pool.query<Issue>(
    `INSERT INTO issues (
      title, description, category, severity, affected_module,
      steps_to_reproduce, screenshot_url, is_blocking, status, submitted_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      input.title,
      input.description || '',
      input.category || 'other',
      input.severity || 'medium',
      input.affected_module ?? null,
      input.steps_to_reproduce ?? null,
      input.screenshot_url ?? null,
      input.is_blocking ?? false,
      'NEW' as IssueStatus,
      submittedBy,
    ],
  );
  return result.rows[0];
}

export async function updateIssue(
  id: number,
  input: UpdateIssueInput,
): Promise<Issue | null> {
  const current = await getIssueById(id);
  if (!current) return null;

  const sets: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  const fields: (keyof UpdateIssueInput)[] = [
    'title', 'description', 'category', 'severity', 'affected_module',
    'steps_to_reproduce', 'screenshot_url', 'is_blocking', 'status', 'assigned_to',
  ];

  for (const field of fields) {
    if (input[field] !== undefined) {
      sets.push(`${field} = $${paramIndex++}`);
      values.push(input[field]);
    }
  }

  // Handle resolved_at — set when moving to RESOLVED, clear when moving away
  if (input.status === 'RESOLVED' && current.status !== 'RESOLVED') {
    sets.push(`resolved_at = NOW()`);
  } else if (input.status && input.status !== 'RESOLVED' && current.status === 'RESOLVED') {
    sets.push(`resolved_at = NULL`);
  }

  if (input.resolved_at !== undefined) {
    // Allow explicit override
    const resolveFieldIdx = sets.findIndex((s) => s.startsWith('resolved_at'));
    if (resolveFieldIdx >= 0) {
      sets[resolveFieldIdx] = `resolved_at = $${paramIndex++}`;
      values.push(input.resolved_at);
    } else {
      sets.push(`resolved_at = $${paramIndex++}`);
      values.push(input.resolved_at);
    }
  }

  if (sets.length === 0) return current;

  sets.push(`updated_at = NOW()`);

  const result = await pool.query<Issue>(
    `UPDATE issues SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    [...values, id],
  );
  return result.rows[0] || null;
}

export async function updateIssueStatus(
  id: number,
  input: UpdateIssueStatusInput,
): Promise<Issue | null> {
  const current = await getIssueById(id);
  if (!current) return null;

  const values: unknown[] = [input.status];
  let paramIndex = 2;

  let resolvedAtClause = '';

  if (input.status === 'RESOLVED' && current.status !== 'RESOLVED') {
    resolvedAtClause = `, resolved_at = NOW()`;
  } else if (input.status !== 'RESOLVED' && current.status === 'RESOLVED') {
    resolvedAtClause = `, resolved_at = NULL`;
  }

  const result = await pool.query<Issue>(
    `UPDATE issues SET status = $1${resolvedAtClause}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
    [...values, id],
  );
  return result.rows[0] || null;
}
