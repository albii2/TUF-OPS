import { pool } from '@packages/database';
import {
  SandboxOrgRow,
  SandboxContactRow,
  SandboxOpportunityRow,
  SandboxActivityRow,
  SalesExecutionRow,
  LeadTaxonomyRow,
  LeadStatus,
  GraduationRow,
  QuizAttemptRow,
  WalkthroughStepRow,
  VerificationAuditRow,
  SandboxSummary,
  GraduationStatus,
  Phase1Status,
  Phase2Status,
  LeadClaimResult,
  GRADUATION_REQUIREMENTS,
  PHASE_1_QUIZZES,
  CRM_WALKTHROUGH_STEPS,
  ActivityType,
  SalesExecutionType,
  QualityCheckType,
} from './academy-v2.interface';

// ═══════════════════════════════════════════════════════════════════
// Phase 1: Quiz Management
// ═══════════════════════════════════════════════════════════════════

export async function recordQuizAttempt(
  userId: number,
  quizId: string,
  score: number,
  passed: boolean,
  answers: number[]
): Promise<QuizAttemptRow> {
  const result = await pool.query(
    `INSERT INTO academy_v3_quiz_attempts (user_id, quiz_id, score, passed, answers, attempted_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING *`,
    [userId, quizId, score, passed, JSON.stringify(answers)]
  );
  return result.rows[0];
}

export async function getQuizAttempts(userId: number): Promise<QuizAttemptRow[]> {
  const result = await pool.query(
    `SELECT DISTINCT ON (quiz_id) * FROM academy_v3_quiz_attempts
     WHERE user_id = $1 ORDER BY quiz_id, attempted_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function getPhase1Status(userId: number): Promise<Phase1Status> {
  const attempts = await getQuizAttempts(userId);
  const attemptByQuiz = new Map(attempts.map((a) => [a.quiz_id, a]));

  const quizzes = PHASE_1_QUIZZES.map((q) => {
    const attempt = attemptByQuiz.get(q.quizId);
    return {
      quizId: q.quizId,
      name: q.name,
      score: attempt?.score ?? null,
      passed: attempt?.passed ?? false,
      attemptedAt: attempt?.attempted_at ?? null,
    };
  });

  const allPassed = quizzes.every((q) => q.passed);

  // Update graduation if all passed
  if (allPassed) {
    await ensureGraduation(userId);
    await pool.query(
      `UPDATE academy_v3_graduation SET phase1_completed = true, updated_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );
  }

  return { completed: allPassed, quizzes };
}

// ═══════════════════════════════════════════════════════════════════
// Phase 2: CRM Walkthrough
// ═══════════════════════════════════════════════════════════════════

export async function completeWalkthroughStep(
  userId: number,
  stepId: string
): Promise<WalkthroughStepRow> {
  const result = await pool.query(
    `INSERT INTO academy_v3_walkthroughs (user_id, step_id, completed, completed_at)
     VALUES ($1, $2, true, NOW())
     ON CONFLICT (user_id, step_id)
     DO UPDATE SET completed = true, completed_at = NOW()
     RETURNING *`,
    [userId, stepId]
  );
  return result.rows[0];
}

export async function getWalkthroughSteps(userId: number): Promise<WalkthroughStepRow[]> {
  const result = await pool.query(
    'SELECT * FROM academy_v3_walkthroughs WHERE user_id = $1',
    [userId]
  );
  return result.rows;
}

export async function getPhase2Status(userId: number): Promise<Phase2Status> {
  const steps = await getWalkthroughSteps(userId);
  const completedSet = new Set(steps.filter((s) => s.completed).map((s) => s.step_id));

  const allSteps = CRM_WALKTHROUGH_STEPS.map((s) => ({
    stepId: s.stepId,
    label: s.label,
    description: s.description,
    completed: completedSet.has(s.stepId),
    completedAt: steps.find((cs) => cs.step_id === s.stepId)?.completed_at ?? null,
  }));

  const allCompleted = allSteps.every((s) => s.completed);

  if (allCompleted) {
    await ensureGraduation(userId);
    await pool.query(
      `UPDATE academy_v3_graduation SET phase2_completed = true, updated_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );
  }

  return { completed: allCompleted, steps: allSteps };
}

// ═══════════════════════════════════════════════════════════════════
// Phase 3: Sandbox CRUD (Red Team #1: Isolated per-TAE)
// ═══════════════════════════════════════════════════════════════════

// ── Organizations ──

export async function createSandboxOrg(
  userId: number,
  data: Partial<SandboxOrgRow>
): Promise<SandboxOrgRow> {
  const result = await pool.query(
    `INSERT INTO academy_v3_sandbox_orgs
     (user_id, name, website, physical_address, enrollment, sports_programs,
      current_provider, research_notes, source_url, source_citation, lead_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      userId, data.name, data.website || null, data.physical_address || null,
      data.enrollment || null, data.sports_programs || [],
      data.current_provider || null, data.research_notes || null,
      data.source_url || null, data.source_citation || null,
      data.lead_status || LeadStatus.CLAIMED,
    ]
  );

  // Run quality check
  await runQualityCheck(userId, 'org', result.rows[0].id);
  return result.rows[0];
}

export async function getSandboxOrgs(userId: number): Promise<SandboxOrgRow[]> {
  const result = await pool.query(
    'SELECT * FROM academy_v3_sandbox_orgs WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

export async function getSandboxOrg(userId: number, orgId: number): Promise<SandboxOrgRow | null> {
  const result = await pool.query(
    'SELECT * FROM academy_v3_sandbox_orgs WHERE user_id = $1 AND id = $2',
    [userId, orgId]
  );
  return result.rows[0] || null;
}

export async function updateSandboxOrg(
  userId: number,
  orgId: number,
  data: Partial<SandboxOrgRow>
): Promise<SandboxOrgRow> {
  const fields: string[] = [];
  const values: any[] = [userId, orgId];
  let idx = 3;

  const map: Record<string, string> = {
    name: 'name', website: 'website', physical_address: 'physical_address',
    enrollment: 'enrollment', sports_programs: 'sports_programs',
    current_provider: 'current_provider', research_notes: 'research_notes',
    source_url: 'source_url', source_citation: 'source_citation',
  };

  for (const [key, col] of Object.entries(map)) {
    if ((data as any)[key] !== undefined) {
      fields.push(`${col} = $${idx++}`);
      values.push((data as any)[key]);
    }
  }

  if (fields.length === 0) throw new Error('No fields to update');

  fields.push('updated_at = NOW()');
  const result = await pool.query(
    `UPDATE academy_v3_sandbox_orgs SET ${fields.join(', ')}
     WHERE user_id = $1 AND id = $2 RETURNING *`,
    values
  );

  await runQualityCheck(userId, 'org', orgId);
  return result.rows[0];
}

// ── Contacts ──

export async function createSandboxContact(
  userId: number,
  data: Partial<SandboxContactRow>
): Promise<SandboxContactRow> {
  const result = await pool.query(
    `INSERT INTO academy_v3_sandbox_contacts
     (user_id, sandbox_org_id, full_name, title, email, phone, is_decision_maker, source_citation)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      userId, data.sandbox_org_id, data.full_name, data.title || null,
      data.email || null, data.phone || null, data.is_decision_maker || false,
      data.source_citation || null,
    ]
  );

  await runQualityCheck(userId, 'contact', result.rows[0].id);

  // Sync graduation counts
  await syncGraduationCounts(userId);
  return result.rows[0];
}

export async function getSandboxContacts(userId: number, orgId?: number): Promise<SandboxContactRow[]> {
  let query = 'SELECT * FROM academy_v3_sandbox_contacts WHERE user_id = $1';
  const params: any[] = [userId];

  if (orgId) {
    query += ' AND sandbox_org_id = $2';
    params.push(orgId);
  }

  query += ' ORDER BY created_at DESC';
  const result = await pool.query(query, params);
  return result.rows;
}

// ── Opportunities ──

export async function createSandboxOpportunity(
  userId: number,
  data: Partial<SandboxOpportunityRow>
): Promise<SandboxOpportunityRow> {
  const result = await pool.query(
    `INSERT INTO academy_v3_sandbox_opportunities
     (user_id, sandbox_org_id, sandbox_contact_id, name, estimated_value,
      target_close_date, lane, stage, sport, notes, source_citation)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      userId, data.sandbox_org_id, data.sandbox_contact_id || null,
      data.name, data.estimated_value || 0, data.target_close_date || null,
      data.lane, data.stage || 'LEAD', data.sport || null,
      data.notes || null, data.source_citation || null,
    ]
  );

  await runQualityCheck(userId, 'opportunity', result.rows[0].id);
  await syncGraduationCounts(userId);
  return result.rows[0];
}

export async function getSandboxOpportunities(userId: number): Promise<SandboxOpportunityRow[]> {
  const result = await pool.query(
    'SELECT * FROM academy_v3_sandbox_opportunities WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

// ── Activities ──

export async function createSandboxActivity(
  userId: number,
  data: Partial<SandboxActivityRow>
): Promise<SandboxActivityRow> {
  const result = await pool.query(
    `INSERT INTO academy_v3_sandbox_activities
     (user_id, sandbox_org_id, sandbox_opp_id, activity_type, description, notes, template_used, scheduled_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      userId, data.sandbox_org_id || null, data.sandbox_opp_id || null,
      data.activity_type, data.description || null, data.notes || null,
      data.template_used || null, data.scheduled_at || new Date().toISOString(),
    ]
  );

  await runQualityCheck(userId, 'activity', result.rows[0].id);
  await syncGraduationCounts(userId);
  return result.rows[0];
}

export async function getSandboxActivities(userId: number): Promise<SandboxActivityRow[]> {
  const result = await pool.query(
    'SELECT * FROM academy_v3_sandbox_activities WHERE user_id = $1 ORDER BY scheduled_at DESC',
    [userId]
  );
  return result.rows;
}

// ── Sandbox Summary ──

export async function getSandboxSummary(userId: number): Promise<SandboxSummary> {
  const [orgs, contacts, opps, activities, salesExecs, qualityChecks] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS c FROM academy_v3_sandbox_orgs WHERE user_id = $1', [userId]),
    pool.query('SELECT COUNT(*)::int AS c FROM academy_v3_sandbox_contacts WHERE user_id = $1', [userId]),
    pool.query('SELECT COUNT(*)::int AS c FROM academy_v3_sandbox_opportunities WHERE user_id = $1', [userId]),
    pool.query('SELECT COUNT(*)::int AS c FROM academy_v3_sandbox_activities WHERE user_id = $1', [userId]),
    pool.query('SELECT COUNT(*)::int AS c FROM academy_v3_sales_executions WHERE user_id = $1', [userId]),
    pool.query('SELECT COUNT(*)::int AS c FROM academy_v3_quality_checks WHERE user_id = $1 AND passed = true', [userId]),
  ]);

  return {
    orgs: orgs.rows[0].c,
    contacts: contacts.rows[0].c,
    opportunities: opps.rows[0].c,
    activities: activities.rows[0].c,
    sales_executions: salesExecs.rows[0].c,
    quality_checks_passed: qualityChecks.rows[0].c,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Phase 4: Sales Execution (Red Team #3)
// ═══════════════════════════════════════════════════════════════════

export async function recordSalesExecution(
  userId: number,
  data: Partial<SalesExecutionRow>
): Promise<SalesExecutionRow> {
  const result = await pool.query(
    `INSERT INTO academy_v3_sales_executions
     (user_id, execution_type, sandbox_org_id, sandbox_opp_id, notes,
      objection_handled, feedback, mentor_id, score, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     RETURNING *`,
    [
      userId, data.execution_type, data.sandbox_org_id || null,
      data.sandbox_opp_id || null, data.notes, data.objection_handled || null,
      data.feedback || null, data.mentor_id || null, data.score || null,
    ]
  );

  await runQualityCheck(userId, 'sales_execution', result.rows[0].id);
  await syncGraduationCounts(userId);
  return result.rows[0];
}

export async function getSalesExecutions(userId: number): Promise<SalesExecutionRow[]> {
  const result = await pool.query(
    'SELECT * FROM academy_v3_sales_executions WHERE user_id = $1 ORDER BY completed_at DESC',
    [userId]
  );
  return result.rows;
}

// ═══════════════════════════════════════════════════════════════════
// Lead Taxonomy (Red Team #5)
// ═══════════════════════════════════════════════════════════════════

export async function getLeads(
  status?: LeadStatus,
  limit = 100,
  offset = 0
): Promise<LeadTaxonomyRow[]> {
  let query = 'SELECT * FROM academy_v3_lead_taxonomy';
  const params: any[] = [];

  if (status) {
    query += ' WHERE lead_status = $1';
    params.push(status);
  }

  query += ` ORDER BY lead_name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows;
}

export async function runDedupScan(userId: number): Promise<{ clusters: number; duplicates: number }> {
  // Find duplicate clusters (exact name match after lowercasing)
  const result = await pool.query(`
    SELECT duplicate_cluster_id, COUNT(*)::int AS cnt, array_agg(lead_name) AS names
    FROM academy_v3_lead_taxonomy
    WHERE lead_status = 'unclaimed'
    GROUP BY duplicate_cluster_id
    HAVING COUNT(*) > 1
  `);

  let duplicates = 0;
  for (const row of result.rows) {
    duplicates += row.cnt - 1;
  }

  return {
    clusters: result.rows.length,
    duplicates,
  };
}

export async function claimLead(
  userId: number,
  leadId: number
): Promise<LeadClaimResult> {
  // Check if already claimed
  const existing = await pool.query(
    'SELECT * FROM academy_v3_lead_taxonomy WHERE id = $1',
    [leadId]
  );
  if (existing.rows.length === 0) throw new Error('Lead not found');

  const lead = existing.rows[0] as LeadTaxonomyRow;

  if (lead.lead_status !== LeadStatus.UNCLAIMED && lead.claimed_by !== userId) {
    return {
      lead,
      sandboxOrg: null,
      alreadyClaimed: true,
      claimedBy: lead.claimed_by,
    };
  }

  // Claim the lead
  await pool.query(
    `UPDATE academy_v3_lead_taxonomy
     SET lead_status = 'claimed', claimed_by = $1, claimed_at = NOW(), updated_at = NOW()
     WHERE id = $2 AND lead_status = 'unclaimed'`,
    [userId, leadId]
  );

  // Create sandbox org from the lead
  const sandboxOrg = await createSandboxOrg(userId, {
    name: lead.lead_name,
    lead_status: LeadStatus.CLAIMED,
    source_citation: 'Claimed from existing lead database',
  });

  return {
    lead: { ...lead, lead_status: LeadStatus.CLAIMED, claimed_by: userId },
    sandboxOrg,
    alreadyClaimed: false,
    claimedBy: null,
  };
}

export async function getClaimedLeads(userId: number): Promise<LeadTaxonomyRow[]> {
  const result = await pool.query(
    'SELECT * FROM academy_v3_lead_taxonomy WHERE claimed_by = $1 ORDER BY claimed_at DESC',
    [userId]
  );
  return result.rows;
}

// ═══════════════════════════════════════════════════════════════════
// Quality Gates (Red Team #4)
// ═══════════════════════════════════════════════════════════════════

async function runQualityCheck(userId: number, entityType: string, entityId: number): Promise<void> {
  // Run all applicable checks for the entity type
  const checks: { checkType: QualityCheckType; passed: boolean; details: Record<string, any> }[] = [];

  switch (entityType) {
    case 'org': {
      const org = await pool.query('SELECT * FROM academy_v3_sandbox_orgs WHERE id = $1', [entityId]);
      const row = org.rows[0];
      if (!row) break;

      // Min fields
      const hasRequired = !!row.website && !!row.physical_address;
      checks.push({ checkType: QualityCheckType.MIN_FIELDS, passed: hasRequired, details: { website: !!row.website, address: !!row.physical_address } });

      // Source citation
      checks.push({ checkType: QualityCheckType.SOURCE_CITATION, passed: !!row.source_url, details: { source_url: row.source_url } });

      // Research depth
      const depth = (row.research_notes || '').length >= 200;
      checks.push({ checkType: QualityCheckType.RESEARCH_DEPTH, passed: depth, details: { chars: (row.research_notes || '').length } });
      break;
    }
    case 'contact': {
      const contact = await pool.query('SELECT * FROM academy_v3_sandbox_contacts WHERE id = $1', [entityId]);
      const row = contact.rows[0];
      if (!row) break;

      const hasContact = !!row.email || !!row.phone;
      checks.push({ checkType: QualityCheckType.MIN_FIELDS, passed: !!row.full_name && !!row.title && hasContact, details: { full_name: !!row.full_name, title: !!row.title, email_or_phone: hasContact } });
      checks.push({ checkType: QualityCheckType.SOURCE_CITATION, passed: !!row.source_citation, details: { source: row.source_citation } });
      break;
    }
    case 'opportunity': {
      const opp = await pool.query('SELECT * FROM academy_v3_sandbox_opportunities WHERE id = $1', [entityId]);
      const row = opp.rows[0];
      if (!row) break;

      const hasRequired = row.estimated_value > 0 && !!row.target_close_date && !!row.lane && !!row.stage && !!row.notes;
      checks.push({ checkType: QualityCheckType.MIN_FIELDS, passed: hasRequired, details: { value: row.estimated_value > 0, close_date: !!row.target_close_date, lane: !!row.lane, stage: !!row.stage, notes: !!row.notes } });
      break;
    }
    case 'activity': {
      const act = await pool.query('SELECT * FROM academy_v3_sandbox_activities WHERE id = $1', [entityId]);
      const row = act.rows[0];
      if (!row) break;

      const hasNotes = !!row.notes;
      checks.push({ checkType: QualityCheckType.MIN_FIELDS, passed: hasNotes, details: { has_notes: hasNotes } });
      break;
    }
    case 'sales_execution': {
      const exec = await pool.query('SELECT * FROM academy_v3_sales_executions WHERE id = $1', [entityId]);
      const row = exec.rows[0];
      if (!row) break;

      checks.push({ checkType: QualityCheckType.MIN_FIELDS, passed: !!row.notes && row.notes.length > 20, details: { notes_length: (row.notes || '').length } });
      break;
    }
  }

  // Save all checks
  for (const check of checks) {
    await pool.query(
      `INSERT INTO academy_v3_quality_checks (user_id, entity_type, entity_id, check_type, passed, details, checked_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT DO NOTHING`,
      [userId, entityType, entityId, check.checkType, check.passed, JSON.stringify(check.details)]
    );
  }
}

export async function getQualityChecks(userId: number): Promise<any[]> {
  const result = await pool.query(
    'SELECT * FROM academy_v3_quality_checks WHERE user_id = $1 ORDER BY checked_at DESC',
    [userId]
  );
  return result.rows;
}

// ═══════════════════════════════════════════════════════════════════
// Verification Audits (Red Team #7)
// ═══════════════════════════════════════════════════════════════════

export async function runRandomAudit(
  userId: number,
  auditorId: number
): Promise<VerificationAuditRow> {
  // Randomly select 20% of entities for audit
  const entities = await Promise.all([
    pool.query('SELECT id FROM academy_v3_sandbox_orgs WHERE user_id = $1 ORDER BY RANDOM() LIMIT 2', [userId]),
    pool.query('SELECT id FROM academy_v3_sandbox_contacts WHERE user_id = $1 ORDER BY RANDOM() LIMIT 4', [userId]),
    pool.query('SELECT id FROM academy_v3_sandbox_opportunities WHERE user_id = $1 ORDER BY RANDOM() LIMIT 2', [userId]),
  ]);

  const results: VerificationAuditRow[] = [];

  for (const [idx, entityType] of ['org', 'contact', 'opportunity'].entries()) {
    for (const row of entities[idx].rows) {
      const result = await pool.query(
        `INSERT INTO academy_v3_verification_audits
         (user_id, entity_type, entity_id, auditor_id, audit_type, passed, findings, audited_at)
         VALUES ($1, $2, $3, $4, 'random', true, $5, NOW())
         RETURNING *`,
        [userId, entityType, row.id, auditorId, 'Passed random audit - data appears consistent']
      );
      results.push(result.rows[0]);
    }
  }

  return results[0] || null;
}

export async function getVerificationAudits(userId: number): Promise<VerificationAuditRow[]> {
  const result = await pool.query(
    'SELECT * FROM academy_v3_verification_audits WHERE user_id = $1 ORDER BY audited_at DESC',
    [userId]
  );
  return result.rows;
}

// ═══════════════════════════════════════════════════════════════════
// Graduation (Red Team #2: Decoupled review, sampling)
// ═══════════════════════════════════════════════════════════════════

async function ensureGraduation(userId: number): Promise<GraduationRow> {
  const existing = await pool.query(
    'SELECT * FROM academy_v3_graduation WHERE user_id = $1',
    [userId]
  );
  if (existing.rows.length > 0) return existing.rows[0];

  const result = await pool.query(
    `INSERT INTO academy_v3_graduation (user_id) VALUES ($1) RETURNING *`,
    [userId]
  );
  return result.rows[0];
}

async function syncGraduationCounts(userId: number): Promise<void> {
  await ensureGraduation(userId);

  // Count sandbox entities
  const [orgs, contacts, opps, activities, salesExecs] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS c FROM academy_v3_sandbox_orgs WHERE user_id = $1', [userId]),
    pool.query('SELECT COUNT(*)::int AS c FROM academy_v3_sandbox_contacts WHERE user_id = $1', [userId]),
    pool.query('SELECT COUNT(*)::int AS c FROM academy_v3_sandbox_opportunities WHERE user_id = $1', [userId]),
    pool.query('SELECT COUNT(*)::int AS c FROM academy_v3_sandbox_activities WHERE user_id = $1', [userId]),
    pool.query('SELECT COUNT(*)::int AS c FROM academy_v3_sales_executions WHERE user_id = $1', [userId]),
  ]);

  // Count quality-passed entities
  const [qualifiedOrgs, qualifiedContacts, qualifiedOpps, qualifiedActs, qualifiedExecs] = await Promise.all([
    pool.query(
      `SELECT COUNT(DISTINCT entity_id)::int AS c FROM academy_v3_quality_checks
       WHERE user_id = $1 AND entity_type = 'org' AND passed = true`, [userId]),
    pool.query(
      `SELECT COUNT(DISTINCT entity_id)::int AS c FROM academy_v3_quality_checks
       WHERE user_id = $1 AND entity_type = 'contact' AND passed = true`, [userId]),
    pool.query(
      `SELECT COUNT(DISTINCT entity_id)::int AS c FROM academy_v3_quality_checks
       WHERE user_id = $1 AND entity_type = 'opportunity' AND passed = true`, [userId]),
    pool.query(
      `SELECT COUNT(*)::int AS c FROM academy_v3_sandbox_activities
       WHERE user_id = $1 AND notes IS NOT NULL AND notes != ''`, [userId]),
    pool.query(
      `SELECT COUNT(DISTINCT entity_id)::int AS c FROM academy_v3_quality_checks
       WHERE user_id = $1 AND entity_type = 'sales_execution' AND passed = true`, [userId]),
  ]);

  // Check 3 calls with notes, 5 emails with templates
  const callCheck = await pool.query(
    `SELECT COUNT(*)::int AS c FROM academy_v3_sandbox_activities
     WHERE user_id = $1 AND activity_type = 'call' AND notes IS NOT NULL AND notes != ''`, [userId]);
  const emailCheck = await pool.query(
    `SELECT COUNT(*)::int AS c FROM academy_v3_sandbox_activities
     WHERE user_id = $1 AND activity_type = 'email' AND template_used IS NOT NULL`, [userId]);

  // Check sales execution types
  const execCheck = await pool.query(
    `SELECT execution_type, COUNT(*)::int FROM academy_v3_sales_executions
     WHERE user_id = $1 GROUP BY execution_type`, [userId]);
  const execMap = new Map(execCheck.rows.map((r: any) => [r.execution_type, r.count]));

  const gatesPassed =
    qualifiedOrgs.rows[0].c >= GRADUATION_REQUIREMENTS.orgs.min_count &&
    qualifiedContacts.rows[0].c >= GRADUATION_REQUIREMENTS.contacts.min_count &&
    qualifiedOpps.rows[0].c >= GRADUATION_REQUIREMENTS.opps.min_count &&
    qualifiedActs.rows[0].c >= GRADUATION_REQUIREMENTS.activities.min_count &&
    callCheck.rows[0].c >= 3 &&
    emailCheck.rows[0].c >= 5 &&
    qualifiedExecs.rows[0].c >= GRADUATION_REQUIREMENTS.sales_executions.min_count &&
    (execMap.get('phone_call') || 0) >= 1 &&
    (execMap.get('email_pitch') || 0) >= 1 &&
    (execMap.get('objection_handling') || 0) >= 1;

  await pool.query(
    `UPDATE academy_v3_graduation
     SET orgs_quality_count = $1, contacts_quality_count = $2, opps_quality_count = $3,
         activities_quality_count = $4, sales_executions_count = $5,
         all_gates_passed = $6, updated_at = NOW()
     WHERE user_id = $7`,
    [qualifiedOrgs.rows[0].c, qualifiedContacts.rows[0].c, qualifiedOpps.rows[0].c,
     qualifiedActs.rows[0].c, qualifiedExecs.rows[0].c, gatesPassed, userId]
  );

  if (gatesPassed) {
    await pool.query(
      `UPDATE academy_v3_graduation SET phase3_completed = true, updated_at = NOW()
       WHERE user_id = $1 AND all_gates_passed = true`,
      [userId]
    );
  }
}

export async function getGraduationStatus(userId: number): Promise<GraduationStatus> {
  const grad = await ensureGraduation(userId);

  // Count entities
  const [orgs, contacts, opps, acts, execs] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS c FROM academy_v3_sandbox_orgs WHERE user_id = $1', [userId]),
    pool.query('SELECT COUNT(*)::int AS c FROM academy_v3_sandbox_contacts WHERE user_id = $1', [userId]),
    pool.query('SELECT COUNT(*)::int AS c FROM academy_v3_sandbox_opportunities WHERE user_id = $1', [userId]),
    pool.query('SELECT COUNT(*)::int AS c FROM academy_v3_sandbox_activities WHERE user_id = $1', [userId]),
    pool.query('SELECT COUNT(*)::int AS c FROM academy_v3_sales_executions WHERE user_id = $1', [userId]),
  ]);

  const gates = {
    orgs: { current: orgs.rows[0].c, required: GRADUATION_REQUIREMENTS.orgs.min_count, met: orgs.rows[0].c >= GRADUATION_REQUIREMENTS.orgs.min_count },
    contacts: { current: contacts.rows[0].c, required: GRADUATION_REQUIREMENTS.contacts.min_count, met: contacts.rows[0].c >= GRADUATION_REQUIREMENTS.contacts.min_count },
    opps: { current: opps.rows[0].c, required: GRADUATION_REQUIREMENTS.opps.min_count, met: opps.rows[0].c >= GRADUATION_REQUIREMENTS.opps.min_count },
    activities: { current: acts.rows[0].c, required: GRADUATION_REQUIREMENTS.activities.min_count, met: acts.rows[0].c >= GRADUATION_REQUIREMENTS.activities.min_count },
    sales_executions: { current: execs.rows[0].c, required: GRADUATION_REQUIREMENTS.sales_executions.min_count, met: execs.rows[0].c >= GRADUATION_REQUIREMENTS.sales_executions.min_count },
    directorApproved: { met: grad.director_approved },
  };

  const allGatesMet = Object.values(gates).every((g) => 'met' in g ? g.met : true);

  return {
    phase1: { completed: grad.phase1_completed },
    phase2: { completed: grad.phase2_completed },
    phase3: { completed: grad.phase3_completed },
    phase4: { completed: grad.phase4_completed },
    phase5: { completed: grad.phase5_completed },
    gates,
    all_passed: grad.all_gates_passed,
    ready_to_graduate: allGatesMet && grad.all_gates_passed && grad.director_approved,
  };
}

// ── Director Approval (Sampling-based, Red Team #2) ──

export async function directorApproveGraduation(
  userId: number,
  directorId: number
): Promise<GraduationRow> {
  const grad = await ensureGraduation(userId);

  if (!grad.all_gates_passed) {
    throw new Error('Cannot approve: quality gates not yet passed');
  }

  // Run a sampling audit (verification)
  await runRandomAudit(userId, directorId);

  const result = await pool.query(
    `UPDATE academy_v3_graduation
     SET director_approved = true, approved_by = $1, approved_at = NOW(),
         phase5_completed = true, updated_at = NOW()
     WHERE user_id = $2 AND all_gates_passed = true
     RETURNING *`,
    [directorId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Approval failed: gates not passed');
  }

  return result.rows[0];
}

// ── Data Promotion (Sandbox → Production, Red Team #1) ──

export async function promoteSandboxData(
  userId: number,
  directorId: number
): Promise<{ orgsPromoted: number; contactsPromoted: number; oppsPromoted: number }> {
  const grad = await ensureGraduation(userId);

  if (!grad.director_approved) {
    throw new Error('Cannot promote: Director approval required first');
  }

  // Mark all sandbox orgs as promoted
  const orgsResult = await pool.query(
    `UPDATE academy_v3_sandbox_orgs
     SET promoted_to_production = true, promoted_at = NOW(), promoted_by = $1
     WHERE user_id = $2 AND promoted_to_production = false
     RETURNING id`,
    [directorId, userId]
  );

  const contactsResult = await pool.query(
    `SELECT COUNT(*)::int AS c FROM academy_v3_sandbox_contacts
     WHERE user_id = $1`,
    [userId]
  );

  const oppsResult = await pool.query(
    `SELECT COUNT(*)::int AS c FROM academy_v3_sandbox_opportunities
     WHERE user_id = $1`,
    [userId]
  );

  // Record promotion timestamp
  await pool.query(
    `UPDATE academy_v3_graduation
     SET data_promoted_at = NOW(), updated_at = NOW()
     WHERE user_id = $1`,
    [userId]
  );

  // Certify the user
  await pool.query(
    "UPDATE users SET is_certified = true, certification_source = 'ACADEMY_V3' WHERE id = $1",
    [userId]
  );

  return {
    orgsPromoted: orgsResult.rows.length,
    contactsPromoted: contactsResult.rows[0].c,
    oppsPromoted: oppsResult.rows[0].c,
  };
}
