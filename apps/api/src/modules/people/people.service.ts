import { pool } from '@packages/database';

export const PIPELINE_STAGES = [
  'application', 'interview', 'offer', 'acceptance',
  'documents', 'account_created', 'academy', 'certified',
  'territory_assigned', 'pipeline_assigned', 'first_appointment',
  'first_proposal', 'first_order'
] as const;

export const STAGE_LABELS: Record<string, string> = {
  application: '📋 Application',
  interview: '🎙️ Interview',
  offer: '📝 Offer',
  acceptance: '✅ Acceptance',
  documents: '📄 Documents',
  account_created: '🔑 Account Created',
  academy: '📚 Academy',
  certified: '🎓 Certified',
  territory_assigned: '🗺️ Territory Assigned',
  pipeline_assigned: '📊 Pipeline Assigned',
  first_appointment: '📅 First Appointment',
  first_proposal: '💰 First Proposal',
  first_order: '🏆 First Order',
};

export async function getPipelineCandidates(filters?: { stage?: string; status?: string; assigned_hr?: string }) {
  let q = 'SELECT * FROM people_pipeline WHERE 1=1';
  const params: any[] = [];
  let i = 1;
  if (filters?.stage) { q += ` AND current_stage = $${i++}`; params.push(filters.stage); }
  if (filters?.status) { q += ` AND status = $${i++}`; params.push(filters.status); }
  if (filters?.assigned_hr) { q += ` AND assigned_hr = $${i++}`; params.push(filters.assigned_hr); }
  q += ' ORDER BY created_at DESC';
  const r = await pool.query(q, params);
  return r.rows;
}

export async function createPipelineCandidate(data: {
  candidate_name: string;
  email?: string;
  phone?: string;
  role?: string;
  territory?: string;
  assigned_director?: string;
  notes?: string;
  created_by: number;
}) {
  const r = await pool.query(
    `INSERT INTO people_pipeline (candidate_name, email, phone, role, territory, assigned_director, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [data.candidate_name, data.email || '', data.phone || '', data.role || 'REP',
     data.territory || '', data.assigned_director || '', data.notes || '', data.created_by]
  );
  return r.rows[0];
}

export async function advancePipelineStage(id: number, stage: string, notes?: string) {
  const dateField = stage + '_date';
  await pool.query(
    `UPDATE people_pipeline SET current_stage = $1, ${dateField} = NOW(), updated_at = NOW() WHERE id = $2`,
    [stage, id]
  );
  await pool.query(
    `INSERT INTO pipeline_stage_history (pipeline_id, stage, notes) VALUES ($1, $2, $3)`,
    [id, stage, notes || '']
  );
  const r = await pool.query('SELECT * FROM people_pipeline WHERE id = $1', [id]);
  return r.rows[0];
}

export async function getPipelineStats() {
  const r = await pool.query(
    `SELECT current_stage, COUNT(*) as count FROM people_pipeline WHERE status = 'active' GROUP BY current_stage`
  );
  const stats: Record<string, number> = {};
  for (const row of r.rows) { stats[row.current_stage] = parseInt(row.count); }
  return stats;
}
