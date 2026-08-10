import { pool } from '@packages/database';
import type { SafeUser } from '../users/users.interface';
import type {
  ExecutiveSummary,
  ParticipantSummary,
  ParticipantDetail,
  ParticipantStatus,
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
    (p) => ['STALLED', 'NEEDS_ATTENTION', 'AWAITING_REVIEW'].includes(p.academyStatus),
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

  // Get all non-ADMIN active users (TAEs, REPs, DIRECTORs in training)
  const usersResult = await pool.query(
    `SELECT id, name, email, role, territory, state_market, cohort, enrollment_date,
            last_login_at, COALESCE(login_count, 0) as login_count,
            is_certified, hr_docs_completed, director_signed_off, practical_exercise_completed
     FROM users
     WHERE status = 'ACTIVE' AND role IN ('REP', 'DIRECTOR', 'REGIONAL_DIRECTOR')
     ORDER BY name`,
  );

  const users = usersResult.rows;

  if (users.length === 0) return [];

  const userIds = users.map((u) => u.id);

  // Get latest academy activity per user
  const academyActivityResult = await pool.query(
    `SELECT user_id, event_type, entity_type, metadata, created_at
     FROM academy_activity_events
     WHERE user_id = ANY($1)
     ORDER BY created_at DESC`,
    [userIds],
  );

  // Get CRM stats per user
  const orgStatsResult = await pool.query(
    `SELECT assigned_rep_id as user_id, COUNT(*) as count
     FROM organizations
     WHERE assigned_rep_id = ANY($1)
     GROUP BY assigned_rep_id`,
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
    `SELECT o.created_by as user_id, COUNT(*) as count
     FROM orders o
     WHERE o.created_by = ANY($1)
     GROUP BY o.created_by`,
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

  return users.map((user) => {
    const activities = userActivity[user.id] || [];
    const lastAcademy = activities.length > 0 ? activities[0].created_at : null;
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
    };
  });
}

export async function getParticipantDetail(
  userId: number,
  actor?: SafeUser | null,
): Promise<ParticipantDetail | null> {
  assertLeadership(actor);

  const userResult = await pool.query(
    `SELECT id, name, email, role, rank, tier, region, state_market, division, territory,
            subterritory, sport_focus, cohort, enrollment_date,
            last_login_at, COALESCE(login_count, 0) as login_count,
            is_certified, hr_docs_completed, director_signed_off, practical_exercise_completed,
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
    'SELECT COUNT(*) as count FROM orders WHERE created_by = $1',
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

  // Build summary
  const summary = await getParticipants(actor);
  const participantSummary = summary.find((p) => p.userId === userId);

  const oppsByStage: Record<string, number> = {};
  oppStagesResult.rows.forEach((r: any) => { oppsByStage[r.stage] = Number(r.count); });

  const activitiesByType: Record<string, number> = {};
  activityTypeResult.rows.forEach((r: any) => {
    activitiesByType[r.type || 'unknown'] = Number(r.count);
  });

  // Attention flags
  const flags: string[] = [];
  const daysSinceLogin = daysBetween(user.last_login_at);
  if (daysSinceLogin >= 4) flags.push(`No login for ${daysSinceLogin} days`);
  if (!user.territory) flags.push('No territory assigned');
  if (!user.is_certified && user.hr_docs_completed && !user.director_signed_off) flags.push('Awaiting Director sign-off');

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
    phaseProgress: {},
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
    certificationDate: user.is_certified ? user.updated_at : null,
    attentionFlags: flags,
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
