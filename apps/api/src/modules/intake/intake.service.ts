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
  // Classification Engine fields
  attention_score: number;
  classification_type: string | null;
  due_date: string | null;
  related_person_id: number | null;
  related_organization_id: number | null;
}

// ── Classification Engine ──

/** Classification types matching the Meridian OS spec */
export const CLASSIFICATION_TYPES = [
  'recruiting_application',
  'recruiting_offer_accepted',
  'rep_inactive',
  'coach_reply',
  'order_paid',
  'mockup_requested',
  'vendor_delayed',
  'email_received',
  'meeting_completed',
  'territory_assigned',
  'executive_decision',
  'hr_onboarding',
  'academy_certification',
  'revenue_blocker',
  'pipeline_update',
  'status_check_response',
  'other',
] as const;

export type ClassificationType = typeof CLASSIFICATION_TYPES[number];

/**
 * Compute an attention score (0–100) for an intake item.
 * Based on Meridian OS Pulse engine — priority, staleness, and classification.
 */
export function computeAttentionScore(item: {
  priority: string;
  status: string;
  classification_type?: string | null;
  created_at?: string;
  due_date?: string | null;
}): number {
  let score = 0;

  // Base priority score
  switch (item.priority) {
    case 'critical': score += 40; break;
    case 'high': score += 25; break;
    case 'medium': score += 10; break;
    default: score += 0;
  }

  // Status multiplier — open items need more attention
  if (item.status === 'open') score += 15;
  if (item.status === 'review') score += 10;

  // Classification urgency boost
  const urgentTypes: string[] = ['revenue_blocker', 'vendor_delayed', 'rep_inactive', 'status_check_response'];
  if (item.classification_type && urgentTypes.includes(item.classification_type)) {
    score += 20;
  }

  // Staleness — items > 7 days old get a boost
  if (item.created_at) {
    const ageDays = (Date.now() - new Date(item.created_at).getTime()) / 86400000;
    if (ageDays > 14) score += 20;
    else if (ageDays > 7) score += 10;
  }

  // Due date pressure — approaching or overdue
  if (item.due_date) {
    const dueInHours = (new Date(item.due_date).getTime() - Date.now()) / 3600000;
    if (dueInHours < 0) score += 25; // Overdue
    else if (dueInHours < 24) score += 20; // Due within 24h
    else if (dueInHours < 72) score += 10; // Due within 3 days
  }

  return Math.min(100, score);
}

/**
 * Auto-classify an intake item based on title / source / tags keywords.
 */
export function classifyIntake(item: {
  title: string;
  description?: string;
  source?: string;
  tags?: string[];
}): ClassificationType {
  const text = `${item.title} ${item.description || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
  const src = (item.source || '').toLowerCase();

  if (src === 'recruiting' || text.includes('applicant') || text.includes('candidate') || text.includes('hire')) {
    if (text.includes('offer') || text.includes('accepted') || text.includes('acceptance')) return 'recruiting_offer_accepted';
    return 'recruiting_application';
  }
  if (src === 'hr' || text.includes('onboarding') || text.includes('hr') || text.includes('personnel')) return 'hr_onboarding';
  if (text.includes('mockup') || text.includes('design') || text.includes('creative')) return 'mockup_requested';
  if (text.includes('vendor') || text.includes('delayed') || text.includes('production')) return 'vendor_delayed';
  if (text.includes('order') || text.includes('paid') || text.includes('payment')) return 'order_paid';
  if (text.includes('inactive') || text.includes('attrition') || text.includes('not active')) return 'rep_inactive';
  if (text.includes('coach') || text.includes('reply') || text.includes('responded')) return 'coach_reply';
  if (text.includes('meeting') || text.includes('call') || text.includes('appointment')) return 'meeting_completed';
  if (text.includes('territory') || text.includes('assigned') || text.includes('reassign')) return 'territory_assigned';
  if (text.includes('revenue') || text.includes('blocker') || text.includes('bottleneck') || text.includes('stuck')) return 'revenue_blocker';
  if (text.includes('pipeline') || text.includes('forecast') || text.includes('opportunity')) return 'pipeline_update';
  if (text.includes('certification') || text.includes('academy') || text.includes('training')) return 'academy_certification';
  if (text.includes('decision') || text.includes('approval') || text.includes('executive')) return 'executive_decision';
  if (text.includes('status check') || text.includes('check-in') || text.includes('checkin') || text.includes('leadership status')) return 'status_check_response';
  if (src === 'email') return 'email_received';

  return 'other';
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
  related_person_id?: number | null;
  related_organization_id?: number | null;
  due_date?: string | null;
}): Promise<IntakeItem> {
  const classification_type = classifyIntake(data);
  const attention_score = computeAttentionScore({
    priority: data.priority || 'medium',
    status: 'open',
    classification_type,
    created_at: new Date().toISOString(),
  });

  const result = await pool.query(
    `INSERT INTO executive_intake (title, description, source, priority, owner, tags, created_by, 
       classification_type, attention_score, related_person_id, related_organization_id, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [data.title, data.description || '', data.source || 'other', data.priority || 'medium',
     data.owner || '', data.tags || [], data.created_by, classification_type, attention_score,
     data.related_person_id || null, data.related_organization_id || null, data.due_date || null]
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

  query += ' ORDER BY COALESCE(attention_score, 0) DESC, CASE priority WHEN \'critical\' THEN 0 WHEN \'high\' THEN 1 WHEN \'medium\' THEN 2 ELSE 3 END, created_at DESC';
  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Lighthouse view — items requiring attention, scored and grouped.
 * This powers the Executive Command Center's "What requires attention?" section.
 */
export async function getLighthouseView(): Promise<{
  items: IntakeItem[];
  byClassification: Record<string, number>;
  highAttention: IntakeItem[];
  overdue: IntakeItem[];
}> {
  const items = await getIntakeItems({ status: 'open' });
  
  // Recompute scores for all open items (scores change as items age)
  const scored = items.map(item => ({
    ...item,
    attention_score: computeAttentionScore(item),
  }));
  
  const highAttention = scored
    .filter(i => i.attention_score >= 50)
    .sort((a, b) => b.attention_score - a.attention_score);
  
  const overdue = scored.filter(i => i.due_date && new Date(i.due_date) < new Date());
  
  const byClassification: Record<string, number> = {};
  for (const item of scored) {
    const type = item.classification_type || 'other';
    byClassification[type] = (byClassification[type] || 0) + 1;
  }
  
  return { items: scored, byClassification, highAttention, overdue };
}

/** Re-compute attention scores for all open items — called periodically */
export async function recalculateAttentionScores(): Promise<number> {
  const items = await getIntakeItems({ status: 'open' });
  let updated = 0;
  for (const item of items) {
    const newScore = computeAttentionScore(item);
    if (newScore !== (item.attention_score || 0)) {
      await pool.query(
        'UPDATE executive_intake SET attention_score = $1 WHERE id = $2',
        [newScore, item.id]
      );
      updated++;
    }
  }
  return updated;
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

/**
 * Create a batch of status check intake items — one per director/recipient.
 * Each item tracks whether a specific leader has responded to a check-in.
 * 
 * This is the "01 issue" fix: HR status checks must never fall through the cracks.
 * Every recipient gets a tracked item. Non-respondents surface in Lighthouse.
 */
export async function createStatusCheckBatch(data: {
  title: string;
  description?: string;
  recipients: Array<{ name: string; email?: string; territory?: string }>;
  due_date: string;
  created_by: number;
}): Promise<{ items: IntakeItem[] }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const items: IntakeItem[] = [];

    for (const recipient of data.recipients) {
      const fullTitle = `${data.title} — ${recipient.name}${recipient.territory ? ` (${recipient.territory})` : ''}`;
      const description = data.description || `Status check response required from ${recipient.name}. Due by end of day.`;

      const attention_score = computeAttentionScore({
        priority: 'high',
        status: 'open',
        classification_type: 'status_check_response',
        created_at: new Date().toISOString(),
        due_date: data.due_date,
      });

      const result = await client.query(
        `INSERT INTO executive_intake 
         (title, description, source, priority, owner, tags, created_by, 
          classification_type, attention_score, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          fullTitle,
          description,
          'hr',
          'high',
          recipient.name,
          ['status-check', 'leadership', recipient.territory || ''].filter(Boolean),
          data.created_by,
          'status_check_response',
          attention_score,
          data.due_date,
        ]
      );

      items.push(result.rows[0]);
    }

    await client.query('COMMIT');
    return { items };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get status check response summary — who's responded vs who hasn't.
 * Recalculates attention scores on each call so overdue items escalate automatically.
 */
export async function getStatusCheckSummary(): Promise<{
  total: number;
  responded: number;
  pending: IntakeItem[];
}> {
  const result = await pool.query(
    `SELECT * FROM executive_intake WHERE classification_type = 'status_check_response' 
     ORDER BY attention_score DESC, created_at DESC`
  );
  const all = result.rows;

  // Recompute scores for all open items — escalates as deadlines pass
  const scored = all.map(item => ({
    ...item,
    attention_score: item.status === 'open' 
      ? computeAttentionScore(item) 
      : item.attention_score,
  }));

  return {
    total: scored.length,
    responded: scored.filter(i => i.status !== 'open').length,
    pending: scored.filter(i => i.status === 'open'),
  };
}
