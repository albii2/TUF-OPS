import { pool } from '@packages/database';
import type { Candidate, CandidateActivity, CreateCandidateInput, UpdateCandidateInput, CandidateStage } from '@tuf/shared';

export async function createCandidate(input: CreateCandidateInput): Promise<Candidate> {
  const result = await pool.query<Candidate>(
    `INSERT INTO candidates (first_name, last_name, email, phone, source, notes, assigned_director_id, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.first_name.trim(),
      input.last_name.trim(),
      input.email.trim().toLowerCase(),
      input.phone || null,
      input.source || 'other',
      input.notes || null,
      input.assigned_director_id || null,
      input.created_by || null,
    ]
  );

  // Log activity
  await pool.query(
    `INSERT INTO candidate_activities (candidate_id, type, description, created_by)
     VALUES ($1, 'resume_uploaded', 'Candidate created from external application', $2)`,
    [result.rows[0].id, input.created_by || null]
  );

  return result.rows[0];
}

export async function getCandidates(params: {
  stage?: string;
  director_id?: number;
  search?: string;
}): Promise<Candidate[]> {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (params.stage && params.stage !== 'ALL') {
    conditions.push(`stage = $${paramIndex++}`);
    values.push(params.stage);
  } else {
    // Default: exclude rejected
    conditions.push(`stage != 'rejected'`);
  }

  if (params.director_id) {
    conditions.push(`assigned_director_id = $${paramIndex++}`);
    values.push(params.director_id);
  }

  if (params.search) {
    conditions.push(`(first_name || ' ' || last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
    values.push(`%${params.search}%`);
    paramIndex++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query<Candidate>(
    `SELECT * FROM candidates ${where} ORDER BY created_at DESC`,
    values
  );
  return result.rows;
}

export async function getCandidateById(id: number): Promise<Candidate | null> {
  const result = await pool.query<Candidate>('SELECT * FROM candidates WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function updateCandidate(id: number, input: UpdateCandidateInput): Promise<Candidate | null> {
  const current = await getCandidateById(id);
  if (!current) return null;

  const sets: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const fields: (keyof UpdateCandidateInput)[] = [
    'stage', 'assigned_director_id', 'territory_id', 'notes',
    'interview_date', 'interview_scorecard', 'offer_details', 'certification_progress'
  ];

  for (const field of fields) {
    if (input[field] !== undefined) {
      sets.push(`${field} = $${paramIndex++}`);
      values.push(input[field]);
    }
  }

  if (sets.length === 0) return current;

  sets.push(`updated_at = NOW()`);

  const result = await pool.query<Candidate>(
    `UPDATE candidates SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    [...values, id]
  );

  // Log stage change activity
  if (input.stage && input.stage !== current.stage) {
    await pool.query(
      `INSERT INTO candidate_activities (candidate_id, type, description)
       VALUES ($1, 'stage_changed', $2)`,
      [id, `Stage changed from ${current.stage} to ${input.stage}`]
    );
  }

  return result.rows[0];
}

export async function setResumeUrl(id: number, url: string): Promise<Candidate | null> {
  const result = await pool.query<Candidate>(
    'UPDATE candidates SET resume_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [url, id]
  );

  if (result.rows[0]) {
    await pool.query(
      `INSERT INTO candidate_activities (candidate_id, type, description)
       VALUES ($1, 'resume_uploaded', 'Resume uploaded')`,
      [id]
    );
  }

  return result.rows[0] || null;
}

export async function getCandidateActivities(candidateId: number): Promise<CandidateActivity[]> {
  const result = await pool.query<CandidateActivity>(
    'SELECT * FROM candidate_activities WHERE candidate_id = $1 ORDER BY created_at DESC',
    [candidateId]
  );
  return result.rows;
}

export async function getRecruitingDashboard(directorId?: number) {
  // Count by stage
  const stageResult = await pool.query<{ stage: string; count: number }>(
    `SELECT stage, COUNT(*)::int as count FROM candidates
     WHERE stage != 'rejected'
     ${directorId ? 'AND assigned_director_id = $1' : ''}
     GROUP BY stage ORDER BY stage`,
    directorId ? [directorId] : []
  );

  // Academy progress
  const academyResult = await pool.query<{ id: number; first_name: string; last_name: string; certification_progress: any }>(
    `SELECT id, first_name, last_name, certification_progress
     FROM candidates WHERE stage = 'academy'
     ${directorId ? 'AND assigned_director_id = $1' : ''}
     ORDER BY last_name`,
    directorId ? [directorId] : []
  );

  return {
    stages: stageResult.rows,
    academy: academyResult.rows.map(r => ({
      id: r.id,
      name: `${r.first_name} ${r.last_name}`,
      progress: r.certification_progress || {},
    })),
  };
}
