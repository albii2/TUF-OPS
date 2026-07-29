import { pool } from '@packages/database';
import {
  AcademyProgressRow,
  AcademyMissionRow,
  AcademyMissionStatus,
  DirectorReviewRow,
  DirectorReviewStatus,
  AcademyChecklistRow,
  AcademyProgressResponse,
  MissionWithReview,
  GraduationCheck,
  PHASE_3_MISSIONS,
  AcademyPhase,
} from './academy.interface';

// ─── Progress Management ──────────────────────────────────────────

export async function getOrCreateProgress(userId: number): Promise<AcademyProgressRow> {
  const existing = await pool.query(
    'SELECT * FROM academy_progress WHERE user_id = $1',
    [userId]
  );
  if (existing.rows.length > 0) return existing.rows[0];

  const result = await pool.query(
    `INSERT INTO academy_progress (user_id, started_at, created_at, updated_at)
     VALUES ($1, NOW(), NOW(), NOW())
     RETURNING *`,
    [userId]
  );
  return result.rows[0];
}

export async function getProgress(userId: number): Promise<AcademyProgressRow | null> {
  const result = await pool.query(
    'SELECT * FROM academy_progress WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

export async function updatePhaseCompletion(
  userId: number,
  phase: AcademyPhase,
  completed: boolean
): Promise<AcademyProgressRow> {
  const progress = await getOrCreateProgress(userId);
  const column = phase === AcademyPhase.PHASE_1_FOUNDATIONS ? 'phase1_completed' :
                  phase === AcademyPhase.PHASE_2_CRM ? 'phase2_completed' : 'phase3_completed';

  const result = await pool.query(
    `UPDATE academy_progress SET ${column} = $1, updated_at = NOW()
     WHERE user_id = $2 RETURNING *`,
    [completed, userId]
  );
  return result.rows[0];
}

// ─── Mission Management ────────────────────────────────────────────

export async function getOrCreateMissions(userId: number): Promise<AcademyMissionRow[]> {
  const existing = await pool.query(
    'SELECT * FROM academy_missions WHERE user_id = $1 ORDER BY mission_number ASC',
    [userId]
  );
  if (existing.rows.length > 0) return existing.rows;

  // Create all 5 missions
  const missions: AcademyMissionRow[] = [];
  for (const def of PHASE_3_MISSIONS) {
    const status = def.mission_number === 1 ? AcademyMissionStatus.AVAILABLE : AcademyMissionStatus.LOCKED;
    const result = await pool.query(
      `INSERT INTO academy_missions (user_id, mission_number, title, description, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (user_id, mission_number) DO UPDATE SET title = $3, description = $4
       RETURNING *`,
      [userId, def.mission_number, def.title, def.instructions, status]
    );
    missions.push(result.rows[0]);
  }
  return missions;
}

export async function getMissions(userId: number): Promise<AcademyMissionRow[]> {
  const result = await pool.query(
    'SELECT * FROM academy_missions WHERE user_id = $1 ORDER BY mission_number ASC',
    [userId]
  );
  return result.rows;
}

export async function startMission(userId: number, missionNumber: number): Promise<AcademyMissionRow> {
  const result = await pool.query(
    `UPDATE academy_missions
     SET status = $1, started_at = NOW(), updated_at = NOW()
     WHERE user_id = $2 AND mission_number = $3 AND status = $4
     RETURNING *`,
    [AcademyMissionStatus.IN_PROGRESS, userId, missionNumber, AcademyMissionStatus.AVAILABLE]
  );
  if (result.rows.length === 0) {
    throw new Error(`Mission ${missionNumber} is not available or does not exist`);
  }
  return result.rows[0];
}

export async function submitMission(userId: number, missionNumber: number): Promise<AcademyMissionRow> {
  const result = await pool.query(
    `UPDATE academy_missions
     SET status = $1, submitted_at = NOW(), updated_at = NOW()
     WHERE user_id = $2 AND mission_number = $3 AND status = $4
     RETURNING *`,
    [AcademyMissionStatus.SUBMITTED, userId, missionNumber, AcademyMissionStatus.IN_PROGRESS]
  );
  if (result.rows.length === 0) {
    throw new Error(`Mission ${missionNumber} is not in progress or does not exist`);
  }
  return result.rows[0];
}

export async function getMissionsWithReviews(userId: number): Promise<MissionWithReview[]> {
  const missions = await getMissions(userId);
  const missionIds = missions.map((m) => m.id);
  if (missionIds.length === 0) return [];

  const reviews = await pool.query(
    `SELECT DISTINCT ON (mission_id) *
     FROM director_reviews
     WHERE mission_id = ANY($1::int[])
     ORDER BY mission_id, created_at DESC`,
    [missionIds]
  );
  const reviewByMission = new Map(reviews.rows.map((r) => [r.mission_id, r]));

  return missions.map((m) => ({
    ...m,
    latestReview: reviewByMission.get(m.id) || null,
  }));
}

// ─── Director Reviews ──────────────────────────────────────────────

export async function createReview(
  missionId: number,
  reviewerId: number,
  status: DirectorReviewStatus,
  strengths: string,
  corrections: string,
  coachingNotes: string
): Promise<DirectorReviewRow> {
  const result = await pool.query(
    `INSERT INTO director_reviews (mission_id, reviewer_id, status, strengths, corrections, coaching_notes, reviewed_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
     RETURNING *`,
    [missionId, reviewerId, status, strengths, corrections, coachingNotes]
  );

  // Update mission status based on review
  if (status === DirectorReviewStatus.APPROVED) {
    await pool.query(
      `UPDATE academy_missions
       SET status = $1, completed_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [AcademyMissionStatus.APPROVED, missionId]
    );
    // Unlock next mission
    await unlockNextMission(missionId);
    // Update checklist
    await syncChecklistForMission(missionId);
  } else if (status === DirectorReviewStatus.REJECTED) {
    await pool.query(
      `UPDATE academy_missions
       SET status = $1, rejection_reason = $2, updated_at = NOW()
       WHERE id = $3`,
      [AcademyMissionStatus.REJECTED, corrections, missionId]
    );
  }

  return result.rows[0];
}

export async function getReviewsByMission(missionId: number): Promise<DirectorReviewRow[]> {
  const result = await pool.query(
    'SELECT * FROM director_reviews WHERE mission_id = $1 ORDER BY created_at DESC',
    [missionId]
  );
  return result.rows;
}

async function unlockNextMission(missionId: number): Promise<void> {
  const mission = await pool.query('SELECT user_id, mission_number FROM academy_missions WHERE id = $1', [missionId]);
  if (mission.rows.length === 0) return;

  const { user_id, mission_number } = mission.rows[0];
  const nextNumber = mission_number + 1;
  if (nextNumber <= 5) {
    await pool.query(
      `UPDATE academy_missions
       SET status = $1, updated_at = NOW()
       WHERE user_id = $2 AND mission_number = $3 AND status = $4`,
      [AcademyMissionStatus.AVAILABLE, user_id, nextNumber, AcademyMissionStatus.LOCKED]
    );
  }
}

// ─── Certification Checklist ───────────────────────────────────────

export async function getOrCreateChecklist(userId: number): Promise<AcademyChecklistRow> {
  const existing = await pool.query(
    'SELECT * FROM academy_checklist WHERE user_id = $1',
    [userId]
  );
  if (existing.rows.length > 0) return existing.rows[0];

  const result = await pool.query(
    `INSERT INTO academy_checklist (user_id, created_at, updated_at)
     VALUES ($1, NOW(), NOW())
     RETURNING *`,
    [userId]
  );
  return result.rows[0];
}

export async function getChecklist(userId: number): Promise<AcademyChecklistRow | null> {
  const result = await pool.query(
    'SELECT * FROM academy_checklist WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

export async function syncChecklist(userId: number): Promise<AcademyChecklistRow> {
  // Count real CRM data for this user
  const ownerId = userId;

  // Organization count — orgs assigned to this rep
  const orgsResult = await pool.query(
    `SELECT COUNT(*)::int AS count FROM organizations WHERE assigned_rep_id = $1`,
    [ownerId]
  );
  const orgsCreated = orgsResult.rows[0]?.count || 0;

  // Contacts count — contacts in orgs owned by this rep
  const contactsResult = await pool.query(
    `SELECT COUNT(*)::int AS count FROM contacts
     JOIN organizations ON organizations.id = contacts.organization_id
     WHERE organizations.assigned_rep_id = $1`,
    [ownerId]
  );
  const contactsAdded = contactsResult.rows[0]?.count || 0;

  // Opportunities count — opportunities assigned to this rep
  const oppsResult = await pool.query(
    `SELECT COUNT(*)::int AS count FROM opportunities WHERE assigned_rep_id = $1`,
    [ownerId]
  );
  const opportunitiesCreated = oppsResult.rows[0]?.count || 0;

  // Activities count — from both rep_activities and activities tables
  const activitiesResult = await pool.query(
    `SELECT (
      (SELECT COUNT(*)::int FROM rep_activities WHERE user_id = $1) +
      (SELECT COUNT(*)::int FROM activities WHERE created_by = $1)
    ) AS count`,
    [ownerId]
  );
  const activitiesLogged = activitiesResult.rows[0]?.count || 0;

  // Check if all opportunities have required details
  const oppDetailsResult = await pool.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE estimated_value IS NOT NULL AND estimated_value > 0
                             AND stage IS NOT NULL
                             AND next_action_date IS NOT NULL
                             AND EXISTS (SELECT 1 FROM opportunity_notes WHERE opportunity_id = opportunities.id))::int AS complete
     FROM opportunities
     WHERE assigned_rep_id = $1`,
    [ownerId]
  );
  const { total, complete } = oppDetailsResult.rows[0];
  const allOppsHaveDetails = total > 0 && complete >= total;

  // Upsert checklist
  const checklist = await getOrCreateChecklist(userId);
  const result = await pool.query(
    `UPDATE academy_checklist
     SET orgs_created = $1, contacts_added = $2, opportunities_created = $3,
         activities_logged = $4, all_opps_have_details = $5,
         last_synced_at = NOW(), updated_at = NOW()
     WHERE user_id = $6
     RETURNING *`,
    [orgsCreated, contactsAdded, opportunitiesCreated, activitiesLogged, allOppsHaveDetails, userId]
  );

  // Check if graduation requirements met
  const row = result.rows[0];
  await checkAndGraduate(userId, row);

  return row;
}

async function syncChecklistForMission(missionId: number): Promise<void> {
  const mission = await pool.query('SELECT user_id FROM academy_missions WHERE id = $1', [missionId]);
  if (mission.rows.length > 0) {
    await syncChecklist(mission.rows[0].user_id);
  }
}

async function checkAndGraduate(userId: number, checklist: AcademyChecklistRow): Promise<boolean> {
  const allMet =
    checklist.orgs_created >= checklist.orgs_required &&
    checklist.contacts_added >= checklist.contacts_required &&
    checklist.opportunities_created >= checklist.opportunities_required &&
    checklist.activities_logged >= checklist.activities_required &&
    checklist.all_opps_have_details &&
    checklist.territory_approved;

  if (allMet) {
    const progress = await getOrCreateProgress(userId);
    if (!progress.director_approved) return false; // Still need director approval

    await pool.query(
      `UPDATE academy_progress
       SET phase3_completed = true, graduated = true, completed_at = NOW(), updated_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );
    // Certify the user
    await pool.query(
      "UPDATE users SET is_certified = true, certification_source = 'ACADEMY_V2' WHERE id = $1",
      [userId]
    );
    return true;
  }
  return false;
}

// ─── Graduation Check ──────────────────────────────────────────────

export async function getGraduationCheck(userId: number): Promise<GraduationCheck> {
  const checklist = await syncChecklist(userId);

  const requirements = {
    orgs: {
      current: checklist.orgs_created,
      required: checklist.orgs_required,
      met: checklist.orgs_created >= checklist.orgs_required,
    },
    contacts: {
      current: checklist.contacts_added,
      required: checklist.contacts_required,
      met: checklist.contacts_added >= checklist.contacts_required,
    },
    opportunities: {
      current: checklist.opportunities_created,
      required: checklist.opportunities_required,
      met: checklist.opportunities_created >= checklist.opportunities_required,
    },
    activities: {
      current: checklist.activities_logged,
      required: checklist.activities_required,
      met: checklist.activities_logged >= checklist.activities_required,
    },
    oppDetails: {
      met: checklist.all_opps_have_details,
    },
    territoryApproved: {
      met: checklist.territory_approved,
    },
  };

  const passed = Object.values(requirements).every((r) => 'met' in r ? r.met : true);

  return { passed, requirements };
}

// ─── Full Progress Response ────────────────────────────────────────

export async function getFullProgress(userId: number): Promise<AcademyProgressResponse> {
  const progress = await getOrCreateProgress(userId);
  const missions = await getOrCreateMissions(userId);
  const checklist = await syncChecklist(userId);

  const missingRequirements: string[] = [];
  if (checklist.orgs_created < checklist.orgs_required)
    missingRequirements.push(`${checklist.orgs_required - checklist.orgs_created} more organizations needed`);
  if (checklist.contacts_added < checklist.contacts_required)
    missingRequirements.push(`${checklist.contacts_required - checklist.contacts_added} more contacts needed`);
  if (checklist.opportunities_created < checklist.opportunities_required)
    missingRequirements.push(`${checklist.opportunities_required - checklist.opportunities_created} more opportunities needed`);
  if (checklist.activities_logged < checklist.activities_required)
    missingRequirements.push(`${checklist.activities_required - checklist.activities_logged} more activities needed`);
  if (!checklist.all_opps_have_details)
    missingRequirements.push('All opportunities must have estimated value, stage, next action, and notes');
  if (!checklist.territory_approved)
    missingRequirements.push('Territory must be approved by Director');

  const graduationReady =
    missingRequirements.length === 0 && progress.director_approved;

  return {
    progress,
    missions,
    checklist,
    graduationReady,
    missingRequirements,
  };
}

// ─── Director Territory Approval ───────────────────────────────────

export async function directorApproveTerritory(
  userId: number,
  directorId: number
): Promise<AcademyProgressRow> {
  const progress = await getOrCreateProgress(userId);
  const result = await pool.query(
    `UPDATE academy_progress
     SET director_approved = true, approved_by = $1, approved_at = NOW(), updated_at = NOW()
     WHERE user_id = $2
     RETURNING *`,
    [directorId, userId]
  );

  // Mark checklist territory as approved
  await pool.query(
    `UPDATE academy_checklist
     SET territory_approved = true, updated_at = NOW()
     WHERE user_id = $1`,
    [userId]
  );

  // Check graduation
  const checklist = await getChecklist(userId);
  if (checklist) await checkAndGraduate(userId, checklist);

  return result.rows[0];
}

// ─── Expire stale submissions ──────────────────────────────────────

export async function getPendingReviews(): Promise<MissionWithReview[]> {
  const result = await pool.query(
    `SELECT am.*, dr.id as review_id, dr.status as review_status, dr.reviewer_id,
            dr.strengths, dr.corrections, dr.coaching_notes, dr.reviewed_at,
            dr.created_at as review_created_at, dr.updated_at as review_updated_at
     FROM academy_missions am
     LEFT JOIN LATERAL (
       SELECT * FROM director_reviews
       WHERE mission_id = am.id
       ORDER BY created_at DESC
       LIMIT 1
     ) dr ON true
     WHERE am.status = $1
     ORDER BY am.submitted_at ASC`,
    [AcademyMissionStatus.SUBMITTED]
  );

  return result.rows.map((row) => {
    const { review_id, review_status, reviewer_id, strengths, corrections, coaching_notes, reviewed_at, review_created_at, review_updated_at, ...mission } = row;
    return {
      ...mission,
      latestReview: review_id ? {
        id: review_id,
        mission_id: mission.id,
        reviewer_id,
        status: review_status,
        strengths,
        corrections,
        coaching_notes,
        reviewed_at,
        created_at: review_created_at,
        updated_at: review_updated_at,
      } : null,
    };
  });
}
