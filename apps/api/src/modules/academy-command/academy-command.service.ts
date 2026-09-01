import { pool } from '@packages/database';
import type { SafeUser } from '../users/users.interface';
import type {
  ExecutiveSummary,
  ParticipantSummary,
  ParticipantDetail,
  ParticipantStatus,
  AttentionFlag,
  AcademyActivityEvent,
  LogEventPayload,
} from './academy-command.interface';

// ─── Helpers ───────────────────────────────────────────────────────────────

function daysBetween(a: string | null, b?: string): number {
  if (!a) return 999;
  const then = new Date(a).getTime();
  const now = b ? new Date(b).getTime() : Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function hoursBetween(a: string | null): number {
  if (!a) return 999;
  return (Date.now() - new Date(a).getTime()) / (1000 * 60 * 60);
}

/** Latest non-null timestamp (handles both academy events and quiz attempts). */
function pickLatest(...values: Array<string | null | undefined>): string | null {
  let latest: string | null = null;
  for (const v of values) {
    if (!v) continue;
    if (!latest || new Date(v).getTime() > new Date(latest).getTime()) latest = v;
  }
  return latest;
}

const CURRENT_CAMPAIGN = 'Fall/Winter 2026 — Letterman Jackets + Team Stores';

/** Statuses that keep a TAE operationally visible to leadership (CLOSED is excluded). */
const VISIBLE_STATUSES = ['ACTIVE', 'ACTIVATION_PENDING', 'CERTIFICATION_COMPLETE', 'FIELD_READY'];

function computeStatus(
  isCertified: boolean,
  isComplete: boolean,
  daysInactive: number,
  awaitingReview: boolean,
): ParticipantStatus {
  if (isCertified) return 'CERTIFIED';
  if (isComplete) return 'ACADEMY_COMPLETE';
  if (awaitingReview) return 'AWAITING_REVIEW';
  if (daysInactive >= 4) return 'STALLED';
  if (daysInactive >= 2) return 'NEEDS_ATTENTION';
  return 'ON_TRACK';
}

function computeProductionProgress(
  prospectsCreated: number,
  opportunities: number,
  orders: number,
): number {
  // Simple heuristic: prospects=20%, opps=40%, orders=40%
  const prospectScore = Math.min(prospectsCreated / 5, 1) * 20;
  const oppScore = Math.min(opportunities / 4, 1) * 40;
  const orderScore = Math.min(orders / 1, 1) * 40;
  return Math.round(prospectScore + oppScore + orderScore);
}

// ─── Permission ────────────────────────────────────────────────────────────

function assertLeadership(actor?: SafeUser | null): void {
  if (!actor) throw new Error('Authentication required');
  if (!['ADMIN', 'REGIONAL_DIRECTOR', 'DIRECTOR'].includes(actor.role)) {
    throw new Error('Only leadership (ADMIN, DIRECTOR) can access Academy Command');
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

export async function getExecutiveSummary(actor?: SafeUser | null): Promise<ExecutiveSummary> {
  assertLeadership(actor);

  const participants = await getParticipants(actor);

  // Cohort stats
  const totalEnrolled = participants.length;
  const activeThisWeek = participants.filter((p) => p.daysSinceMeaningfulActivity <= 7).length;
  const stalled = participants.filter((p) => p.academyStatus === 'STALLED').length;
  const academyComplete = participants.filter((p) => p.academyStatus === 'ACADEMY_COMPLETE').length;
  const certificationPending = participants.filter(
    (p) => p.academyStatus === 'ACADEMY_COMPLETE' && !p.isCertified,
  ).length;
  const certified = participants.filter((p) => p.isCertified).length;

  const averageCohortProgress = totalEnrolled > 0
    ? Math.round(participants.reduce((sum, p) => sum + p.completionPercent, 0) / totalEnrolled)
    : 0;

  const totalProspectingActivity = participants.reduce((sum, p) => sum + p.prospectsCreated + p.outreachAttempts, 0);
  const meetingsGenerated = participants.reduce((sum, p) => sum + p.meetings, 0);
  const qualifiedOpportunitiesCreated = participants.reduce((sum, p) => sum + p.opportunities, 0);
  const ordersGenerated = participants.reduce((sum, p) => sum + p.orders, 0);

  const attentionRequired = participants.filter(
    (p) =>
      ['STALLED', 'NEEDS_ATTENTION', 'AWAITING_REVIEW'].includes(p.academyStatus) ||
      p.attentionFlags.length > 0,
  );

  const recentActivity = await getRecentActivityFeed(50);

  return {
    activeCohort: {
      totalEnrolled,
      activeThisWeek,
      stalled,
      academyComplete,
      certificationPending,
      certified,
    },
    averageCohortProgress,
    totalProspectingActivity,
    meetingsGenerated,
    qualifiedOpportunitiesCreated,
    ordersGenerated,
    participants,
    attentionRequired,
    recentActivity,
  };
}

export async function getParticipants(actor?: SafeUser | null): Promise<ParticipantSummary[]> {
  assertLeadership(actor);

  // All operationally-visible TAEs (REP/DIRECTOR/REGIONAL_DIRECTOR) across the
  // full personnel state machine. CLOSED records are preserved in the DB but
  // must NOT surface operationally — they are excluded here.
  const usersResult = await pool.query(
    `SELECT id, name, email, role, status, territory, state_market, cohort, enrollment_date, created_at,
            last_login_at, COALESCE(login_count, 0) as login_count,
            is_certified, hr_docs_completed, director_signed_off, practical_exercise_completed,
            certified_at, certified_by, academy_version
     FROM users
     WHERE status = ANY($1) AND role IN ('REP', 'DIRECTOR', 'REGIONAL_DIRECTOR')
     ORDER BY name`,
    [VISIBLE_STATUSES],
  );

  const users = usersResult.rows;

  if (users.length === 0) return [];

  const userIds = users.map((u: any) => u.id);

  // Get latest academy activity per user
  const academyActivityResult = await pool.query(
    `SELECT user_id, event_type, entity_type, metadata, created_at
     FROM academy_activity_events
     WHERE user_id = ANY($1)
     ORDER BY created_at DESC`,
    [userIds],
  );

  // v3 quiz attempts (source of truth for module completion + quiz scores)
  const quizAttemptsResult = await pool.query(
    `SELECT user_id, quiz_id, score, passed, attempted_at
     FROM academy_v3_quiz_attempts
     WHERE user_id = ANY($1)
     ORDER BY attempted_at DESC`,
    [userIds],
  );

  // Academy progress (phase gates, graduation)
  const academyProgressResult = await pool.query(
    `SELECT user_id, phase1_completed, phase2_completed, phase3_completed,
            graduated, director_approved, started_at, completed_at
     FROM academy_progress
     WHERE user_id = ANY($1)`,
    [userIds],
  );

  // CRM stats per user
  const orgStatsResult = await pool.query(
    `SELECT assigned_rep_id as user_id, COUNT(*) as count
     FROM organizations
     WHERE assigned_rep_id = ANY($1)
     GROUP BY assigned_rep_id`,
    [userIds],
  );

  // Launch clusters per user (distinct launch_cluster values on their orgs)
  const clusterResult = await pool.query(
    `SELECT assigned_rep_id as user_id, launch_cluster
     FROM organizations
     WHERE assigned_rep_id = ANY($1)
       AND launch_cluster IS NOT NULL
       AND trim(launch_cluster) <> ''
     GROUP BY assigned_rep_id, launch_cluster
     ORDER BY assigned_rep_id, launch_cluster`,
    [userIds],
  );

  const oppStatsResult = await pool.query(
    `SELECT created_by as user_id, COUNT(*) as count,
            COALESCE(SUM(COALESCE(value, 0)), 0) as total_value
     FROM opportunities
     WHERE created_by = ANY($1)
     GROUP BY created_by`,
    [userIds],
  );

  const activityStatsResult = await pool.query(
    `SELECT created_by as user_id,
            COUNT(*) FILTER (WHERE type = 'CALL' OR type = 'EMAIL') as outreach_count,
            COUNT(*) FILTER (WHERE type = 'MEETING' OR description ILIKE '%meeting%') as meeting_count
     FROM activities
     WHERE created_by = ANY($1)
     GROUP BY created_by`,
    [userIds],
  );

  const orderStatsResult = await pool.query(
    `SELECT opp.created_by as user_id, COUNT(DISTINCT o.id) as count
     FROM orders o
     JOIN opportunities opp ON opp.id = o.opportunity_id
     WHERE opp.created_by = ANY($1)
     GROUP BY opp.created_by`,
    [userIds],
  );

  // Build lookup maps
  const orgMap: Record<number, number> = {};
  orgStatsResult.rows.forEach((r: any) => { orgMap[r.user_id] = Number(r.count); });

  const oppMap: Record<number, { count: number; value: number }> = {};
  oppStatsResult.rows.forEach((r: any) => { oppMap[r.user_id] = { count: Number(r.count), value: Number(r.total_value) }; });

  const activityMap: Record<number, { outreach: number; meetings: number }> = {};
  activityStatsResult.rows.forEach((r: any) => {
    activityMap[r.user_id] = { outreach: Number(r.outreach_count), meetings: Number(r.meeting_count) };
  });

  const orderMap: Record<number, number> = {};
  orderStatsResult.rows.forEach((r: any) => { orderMap[r.user_id] = Number(r.count); });

  // Build academy activity per user
  const userActivity: Record<number, AcademyActivityEvent[]> = {};
  academyActivityResult.rows.forEach((r: any) => {
    if (!userActivity[r.user_id]) userActivity[r.user_id] = [];
    userActivity[r.user_id].push(r);
  });

  // Build v3 quiz attempts per user (sorted DESC by attempted_at)
  const quizAttemptsByUser: Record<number, any[]> = {};
  quizAttemptsResult.rows.forEach((r: any) => {
    if (!quizAttemptsByUser[r.user_id]) quizAttemptsByUser[r.user_id] = [];
    quizAttemptsByUser[r.user_id].push(r);
  });

  // Build academy progress per user
  const progressByUser: Record<number, any> = {};
  academyProgressResult.rows.forEach((r: any) => { progressByUser[r.user_id] = r; });

  // Build launch clusters per user
  const clusterMap: Record<number, string[]> = {};
  clusterResult.rows.forEach((r: any) => {
    if (!clusterMap[r.user_id]) clusterMap[r.user_id] = [];
    clusterMap[r.user_id].push(r.launch_cluster);
  });

  // Build knowledge progress from training_assessments
  // Using the training_assessments table for quiz data
  let knowledgeMap: Record<number, number> = {};
  try {
    const knowledgeResult = await pool.query(
      `SELECT te.user_id,
              COUNT(DISTINCT ta.module_id) as modules_assessed,
              COUNT(DISTINCT CASE WHEN ta.passed = true THEN ta.module_id END) as modules_passed
       FROM training_enrollments te
       LEFT JOIN training_assessments ta ON ta.enrollment_id = te.id
       WHERE te.user_id = ANY($1)
       GROUP BY te.user_id`,
      [userIds],
    );
    knowledgeResult.rows.forEach((r: any) => {
      const total = Number(r.modules_assessed) || 0;
      const passed = Number(r.modules_passed) || 0;
      knowledgeMap[r.user_id] = total > 0 ? Math.round((passed / Math.max(total, 6)) * 100) : 0;
    });
  } catch {
    // training_enrollments may not exist for all users
  }

  return users.map((user: any) => {
    const activities = userActivity[user.id] || [];
    const quizAttempts = quizAttemptsByUser[user.id] || [];
    const progress = progressByUser[user.id];
    const lastQuizAttempt = quizAttempts.length > 0 ? quizAttempts[0].attempted_at : null;
    const lastAcademy = pickLatest(activities.length > 0 ? activities[0].created_at : null, lastQuizAttempt);
    const lastActivity = lastAcademy || user.last_login_at;
    const daysInactive = daysBetween(lastActivity);
    const orgs = orgMap[user.id] || 0;
    const opps = oppMap[user.id] || { count: 0, value: 0 };
    const acts = activityMap[user.id] || { outreach: 0, meetings: 0 };
    const orders = orderMap[user.id] || 0;
    const knowledgePercent = knowledgeMap[user.id] || 0;
    const productionPercent = computeProductionProgress(orgs, opps.count, orders);
    const isComplete = knowledgePercent >= 80 && productionPercent >= 40;
    const awaitingReview = activities.some((a) => a.event_type === 'MISSION_STATEMENT_SAVED') && !user.director_signed_off;

    // ── Personnel state machine (Sept 2026 directive) ──
    const quizScores = quizAttempts.map((a: any) => ({
      quiz_id: a.quiz_id,
      score: Number(a.score),
      passed: a.passed,
      attempted_at: a.attempted_at,
    }));
    const passedQuizIds = new Set(quizAttempts.filter((a: any) => a.passed).map((a: any) => a.quiz_id));
    const attemptedQuizIds = new Set(quizAttempts.map((a: any) => a.quiz_id));
    const modulesCompleted = passedQuizIds.size;
    const modulesTotal = attemptedQuizIds.size;
    const moduleCompletionPercent = modulesTotal > 0
      ? Math.round((modulesCompleted / modulesTotal) * 100)
      : 0;

    const flags: AttentionFlag[] = [];
    if (user.status === 'ACTIVE' && quizAttempts.length === 0 && !progress) flags.push('ACTIVATED_NOT_STARTED');
    if (lastAcademy && hoursBetween(lastAcademy) > 72) flags.push('NO_ACTIVITY_72H');
    if (quizAttempts.some((a: any) => !a.passed)) flags.push('FAILED_MODULE_RETRY');
    const enrollmentRef = user.enrollment_date || user.created_at;
    if (enrollmentRef && daysBetween(enrollmentRef) > 7 && !user.is_certified) flags.push('OVER_7D_INCOMPLETE');
    if (user.is_certified && user.status !== 'FIELD_READY') flags.push('CERT_PENDING_APPROVAL');

    return {
      userId: user.id,
      name: user.name || 'Unknown',
      email: user.email,
      role: user.role,
      territory: user.territory,
      cohort: user.cohort,
      enrollmentDate: user.enrollment_date,
      currentPhase: 'Academy v3',
      currentModule: null,
      completionPercent: Math.round((knowledgePercent + productionPercent) / 2),
      academyStatus: computeStatus(user.is_certified, isComplete, daysInactive, awaitingReview),
      lastLogin: user.last_login_at,
      loginCount: user.login_count || 0,
      lastAcademyActivity: lastAcademy,
      lastSalesActivity: null, // derived from activities table
      daysSinceMeaningfulActivity: daysInactive,
      knowledgeProgress: knowledgePercent,
      productionProgress: productionPercent,
      prospectsCreated: orgs,
      outreachAttempts: acts.outreach,
      meetings: acts.meetings,
      opportunities: opps.count,
      orders,
      pipelineValue: opps.value,
      certificationStatus: user.is_certified ? 'CERTIFIED' : 'NOT_CERTIFIED',
      isCertified: user.is_certified,
      certifiedAt: user.certified_at,
      certifiedBy: user.certified_by,
      academyVersion: user.academy_version,
      // ── Personnel state machine fields ──
      activationStatus: user.status || 'ACTIVE',
      ndaCompleted: user.hr_docs_completed || false,
      enrollment: { cohort: user.cohort, date: user.enrollment_date },
      modulesCompleted,
      modulesTotal,
      moduleCompletionPercent,
      quizScores,
      fieldReady: user.status === 'FIELD_READY',
      accountsAssigned: orgs,
      launchClusters: clusterMap[user.id] || [],
      currentCampaign: CURRENT_CAMPAIGN,
      attentionFlags: flags,
    };
  });
}

export async function getParticipantDetail(
  userId: number,
  actor?: SafeUser | null,
): Promise<ParticipantDetail | null> {
  assertLeadership(actor);

  const userResult = await pool.query(
    `SELECT id, name, email, role, status, rank, tier, region, state_market, division, territory,
            subterritory, sport_focus, cohort, enrollment_date,
            last_login_at, COALESCE(login_count, 0) as login_count,
            is_certified, hr_docs_completed, director_signed_off, practical_exercise_completed,
            certified_at, certified_by, academy_version,
            created_at, updated_at
     FROM users WHERE id = $1`,
    [userId],
  );

  if (userResult.rows.length === 0) return null;
  const user = userResult.rows[0];

  // Get academy events
  const eventsResult = await pool.query(
    `SELECT * FROM academy_activity_events
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 100`,
    [userId],
  );

  // Get CRM stats
  const orgCountResult = await pool.query(
    'SELECT COUNT(*) as count FROM organizations WHERE assigned_rep_id = $1',
    [userId],
  );

  const oppStagesResult = await pool.query(
    `SELECT COALESCE(stage, 'Lead') as stage, COUNT(*) as count
     FROM opportunities WHERE created_by = $1
     GROUP BY stage`,
    [userId],
  );

  const oppTotalResult = await pool.query(
    'SELECT COUNT(*) as count, COALESCE(SUM(COALESCE(value, 0)), 0) as total_value FROM opportunities WHERE created_by = $1',
    [userId],
  );

  const activityTypeResult = await pool.query(
    `SELECT type, COUNT(*) as count
     FROM activities WHERE created_by = $1
     GROUP BY type`,
    [userId],
  );

  const orderCountResult = await pool.query(
    `SELECT COUNT(*) as count FROM orders o
     JOIN opportunities opp ON opp.id = o.opportunity_id
     WHERE opp.created_by = $1`,
    [userId],
  );

  // KB progress from training_assessments
  let quizResults: any[] = [];
  try {
    const quizResult = await pool.query(
      `SELECT tm.title as module, ta.score, ta.passed, 1 as attempts, ta.taken_at as last_attempt
       FROM training_enrollments te
       JOIN training_assessments ta ON ta.enrollment_id = te.id
       JOIN training_modules tm ON tm.id = ta.module_id
       WHERE te.user_id = $1
       ORDER BY ta.taken_at DESC`,
      [userId],
    );
    quizResults = quizResult.rows;
  } catch {
    // no training data
  }

  // Module-level learning progress (Learn → Quiz path)
  let moduleProgress: any[] = [];
  let trainingEnrollmentId: number | null = null;
  try {
    const enrollmentRes = await pool.query(
      'SELECT id FROM training_enrollments WHERE user_id = $1',
      [userId],
    );
    if (enrollmentRes.rows.length > 0) {
      trainingEnrollmentId = enrollmentRes.rows[0].id;
      const moduleProgressResult = await pool.query(
        `SELECT tm.id AS module_id, tm.title, tm.phase, tm.order_index,
                tp.status, tp.started_at, tp.completed_at,
                ta.score, ta.passed, ta.taken_at AS last_attempt
         FROM training_modules tm
         LEFT JOIN training_progress tp ON tp.enrollment_id = $1 AND tp.module_id = tm.id
         LEFT JOIN LATERAL (
           SELECT score, passed, taken_at FROM training_assessments
           WHERE enrollment_id = $1 AND module_id = tm.id
           ORDER BY taken_at DESC NULLS LAST, created_at DESC LIMIT 1
         ) ta ON true
         WHERE tm.role = 'REP' AND tm.phase IN ('LEVEL_1_OPERATOR', 'LEVEL_2_PRODUCT')
         ORDER BY tm.order_index ASC`,
        [trainingEnrollmentId],
      );
      moduleProgress = moduleProgressResult.rows;
    }
  } catch {
    // no training data
  }

  // Phase completion from module progress
  const phaseProgress: Record<string, { completed: number; total: number }> = {};
  for (const m of moduleProgress) {
    if (!phaseProgress[m.phase]) phaseProgress[m.phase] = { completed: 0, total: 0 };
    phaseProgress[m.phase].total += 1;
    if (m.status === 'COMPLETED' && m.passed === true) phaseProgress[m.phase].completed += 1;
  }

  // Build summary
  const summary = await getParticipants(actor);
  const participantSummary = summary.find((p) => p.userId === userId);

  const oppsByStage: Record<string, number> = {};
  oppStagesResult.rows.forEach((r: any) => { oppsByStage[r.stage] = Number(r.count); });

  const activitiesByType: Record<string, number> = {};
  activityTypeResult.rows.forEach((r: any) => {
    activitiesByType[r.type || 'unknown'] = Number(r.count);
  });

  // Attention flags — directive flags (from summary) + detail-level signals
  const legacyFlags: string[] = [];
  const daysSinceLogin = daysBetween(user.last_login_at);
  if (daysSinceLogin >= 4) legacyFlags.push(`No login for ${daysSinceLogin} days`);
  if (!user.territory) legacyFlags.push('No territory assigned');
  if (!user.is_certified && user.hr_docs_completed && !user.director_signed_off) legacyFlags.push('Awaiting Director sign-off');
  const attentionFlags: AttentionFlag[] = [
    ...(participantSummary?.attentionFlags || []),
    ...(legacyFlags as AttentionFlag[]),
  ];

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    territory: user.territory,
    cohort: user.cohort,
    enrollmentDate: user.enrollment_date,
    stateMarket: user.state_market,
    division: user.division,
    rank: user.rank,
    currentPhase: participantSummary?.currentPhase || 'Academy v3',
    currentModule: participantSummary?.currentModule || null,
    completionPercent: participantSummary?.completionPercent || 0,
    academyStatus: participantSummary?.academyStatus || 'ON_TRACK',
    lastLogin: user.last_login_at,
    loginCount: user.login_count || 0,
    lastAcademyActivity: participantSummary?.lastAcademyActivity || null,
    lastSalesActivity: participantSummary?.lastSalesActivity || null,
    daysSinceMeaningfulActivity: participantSummary?.daysSinceMeaningfulActivity || 999,
    knowledgeProgress: participantSummary?.knowledgeProgress || 0,
    productionProgress: participantSummary?.productionProgress || 0,
    prospectsCreated: participantSummary?.prospectsCreated || 0,
    outreachAttempts: participantSummary?.outreachAttempts || 0,
    meetings: participantSummary?.meetings || 0,
    opportunities: Number(oppTotalResult.rows[0]?.count || 0),
    orders: participantSummary?.orders || 0,
    pipelineValue: Number(oppTotalResult.rows[0]?.total_value || 0),
    certificationStatus: user.is_certified ? 'CERTIFIED' : 'NOT_CERTIFIED',
    isCertified: user.is_certified,
    certifiedAt: user.certified_at || null,
    certifiedBy: user.certified_by || null,
    academyVersion: user.academy_version || null,
    phaseProgress,
    moduleProgress,
    quizResults: quizResults.map((q: any) => ({
      module: q.module || 'Unknown',
      score: q.score || 0,
      passed: q.passed || false,
      attempts: q.attempts || 0,
      lastAttempt: q.last_attempt || null,
    })),
    coachReviews: [],
    acknowledgments: 0,
    recentActivity: eventsResult.rows,
    organizationsCount: Number(orgCountResult.rows[0]?.count || 0),
    opportunitiesByStage: oppsByStage,
    activitiesByType,
    hrDocsCompleted: user.hr_docs_completed || false,
    directorSignedOff: user.director_signed_off || false,
    practicalExerciseCompleted: user.practical_exercise_completed || false,
    certificationDate: user.certified_at || (user.is_certified ? user.updated_at : null),
    attentionFlags,
    // ── Personnel state machine fields ──
    activationStatus: user.status || participantSummary?.activationStatus || 'ACTIVE',
    ndaCompleted: user.hr_docs_completed || false,
    enrollment: participantSummary?.enrollment || { cohort: user.cohort, date: user.enrollment_date },
    modulesCompleted: participantSummary?.modulesCompleted || 0,
    modulesTotal: participantSummary?.modulesTotal || 0,
    moduleCompletionPercent: participantSummary?.moduleCompletionPercent || 0,
    quizScores: participantSummary?.quizScores || [],
    fieldReady: user.status === 'FIELD_READY' || participantSummary?.fieldReady || false,
    accountsAssigned: participantSummary?.accountsAssigned || 0,
    launchClusters: participantSummary?.launchClusters || [],
    currentCampaign: participantSummary?.currentCampaign || CURRENT_CAMPAIGN,
  };
}

export async function getRecentActivityFeed(limit: number = 50): Promise<Array<{
  id: number;
  userName: string;
  eventType: string;
  description: string;
  timestamp: string;
}>> {
  const result = await pool.query(
    `SELECT a.id, u.name as user_name, a.event_type, a.entity_type, a.metadata, a.created_at
     FROM academy_activity_events a
     JOIN users u ON u.id = a.user_id
     ORDER BY a.created_at DESC
     LIMIT $1`,
    [limit],
  );

  return result.rows.map((r: any) => {
    let description = '';
    const eventType = r.event_type;
    if (eventType === 'QUIZ_PASSED') {
      description = `passed ${r.entity_type || 'quiz'} — ${r.metadata?.score || '?'}%`;
    } else if (eventType === 'QUIZ_FAILED') {
      description = `attempted ${r.entity_type || 'quiz'} — ${r.metadata?.score || '?'}%`;
    } else if (eventType === 'QUIZ_ATTEMPTED') {
      description = `started ${r.entity_type || 'quiz'}`;
    } else if (eventType === 'MODULE_OPENED') {
      description = `opened ${r.entity_type || 'module'}`;
    } else if (eventType === 'MODULE_ACKNOWLEDGED') {
      description = `acknowledged ${r.entity_type || 'module'} review`;
    } else if (eventType === 'MISSION_STATEMENT_SAVED') {
      description = 'submitted mission statement';
    } else if (eventType === 'LOGIN') {
      description = 'logged in';
    } else {
      description = eventType.replace(/_/g, ' ').toLowerCase();
    }
    return {
      id: r.id,
      userName: r.user_name,
      eventType,
      description,
      timestamp: r.created_at,
    };
  });
}

export async function logEvent(
  userId: number,
  payload: LogEventPayload,
): Promise<void> {
  await pool.query(
    `INSERT INTO academy_activity_events (user_id, event_type, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      userId,
      payload.event_type,
      payload.entity_type || null,
      payload.entity_id || null,
      JSON.stringify(payload.metadata || {}),
    ],
  );
}
