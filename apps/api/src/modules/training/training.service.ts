import { pool } from '@packages/database';
import {
  TrainingModule,
  TrainingEnrollment,
  TrainingProgress,
  TrainingRole,
  TrainingPhase,
  TrainingProgressStatus,
  TrainingEnrollmentWithProgress,
  TrainingEnrollmentStatus,
  LEGACY_PHASE_MAP,
} from './training.interface';

const PHASE_ORDER = [
  TrainingPhase.LEVEL_1_OPERATOR,
  TrainingPhase.LEVEL_2_PRODUCT,
];


const CANONICAL_PHASES = new Set<string>(PHASE_ORDER);

function normalizeTrainingPhase(phase: string): TrainingPhase | null {
  if (CANONICAL_PHASES.has(phase)) return phase as TrainingPhase;
  return LEGACY_PHASE_MAP[phase] ?? null;
}

function canonicalTrainingRole(role: TrainingRole): TrainingRole {
  return role === TrainingRole.TAE ? TrainingRole.REP : role;
}

export async function getModulesByRole(role: TrainingRole, phase?: TrainingPhase): Promise<TrainingModule[]> {
  let query = "SELECT * FROM training_modules WHERE role = $1 AND phase IN ('LEVEL_1_OPERATOR', 'LEVEL_2_PRODUCT')";
  const params: any[] = [canonicalTrainingRole(role)];

  if (phase) {
    query += ' AND phase = $2';
    params.push(phase);
  }

  query += ' ORDER BY order_index ASC';
  const result = await pool.query(query, params);
  return result.rows;
}

export async function enrollUserInTraining(userId: number, role: TrainingRole): Promise<TrainingEnrollment> {
  const enrollmentRole = canonicalTrainingRole(role);

  // Check if user already enrolled
  const existing = await pool.query('SELECT * FROM training_enrollments WHERE user_id = $1', [userId]);

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  // Create new enrollment
  const result = await pool.query(
    `INSERT INTO training_enrollments (user_id, role, status, current_phase, enrolled_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())
     RETURNING *`,
    [userId, enrollmentRole, TrainingEnrollmentStatus.ACTIVE, TrainingPhase.LEVEL_1_OPERATOR]
  );

  return result.rows[0];
}

export async function getEnrollmentWithProgress(enrollmentId: number): Promise<TrainingEnrollmentWithProgress> {
  // Get enrollment
  const enrollmentResult = await pool.query(
    'SELECT * FROM training_enrollments WHERE id = $1',
    [enrollmentId]
  );

  if (enrollmentResult.rows.length === 0) {
    throw new Error('Enrollment not found');
  }

  const enrollment = enrollmentResult.rows[0];

  // Get all modules for this role
  const modulesResult = await pool.query(
    "SELECT * FROM training_modules WHERE role = $1 AND phase IN ('LEVEL_1_OPERATOR', 'LEVEL_2_PRODUCT') ORDER BY order_index ASC",
    [enrollment.role]
  );
  const modules = modulesResult.rows as TrainingModule[];

  // Get latest quiz/assessment result for all modules
  const assessmentResult = await pool.query(
    'SELECT DISTINCT ON (module_id) * FROM training_assessments WHERE enrollment_id = $1 ORDER BY module_id, taken_at DESC NULLS LAST, created_at DESC',
    [enrollmentId]
  );
  const assessmentByModule = new Map(assessmentResult.rows.map((row) => [row.module_id, row]));

  // Get progress for all modules
  const progressResult = await pool.query(
    'SELECT * FROM training_progress WHERE enrollment_id = $1',
    [enrollmentId]
  );
  const progress = progressResult.rows;

  // Calculate completion metrics
  const totalModules = modules.length;
  const completedModules = modules.filter((module) => {
    const moduleProgress = progress.find((p) => p.module_id === module.id);
    const moduleAssessment = assessmentByModule.get(module.id);
    const hasQuiz = Array.isArray((module as any).quiz_json) && (module as any).quiz_json.length > 0;
    return moduleProgress?.status === TrainingProgressStatus.COMPLETED && (!hasQuiz || moduleAssessment?.passed === true);
  }).length;
  const percentComplete = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  // Calculate phase completion status
  const phaseCompletionStatus = {} as Record<TrainingPhase, { completed: number; total: number; percentComplete: number }>;
  PHASE_ORDER.forEach((phase) => {
    phaseCompletionStatus[phase] = { completed: 0, total: 0, percentComplete: 0 };
  });

  modules.forEach((module) => {
    const normalizedPhase = normalizeTrainingPhase(module.phase);
    if (!normalizedPhase) {
      console.warn(`Skipping training module ${module.id} with unknown phase ${module.phase}`);
      return;
    }

    phaseCompletionStatus[normalizedPhase].total += 1;
    const moduleProgress = progress.find((p) => p.module_id === module.id);
    const moduleAssessment = assessmentByModule.get(module.id);
    const hasQuiz = Array.isArray((module as any).quiz_json) && (module as any).quiz_json.length > 0;
    if (moduleProgress && moduleProgress.status === TrainingProgressStatus.COMPLETED && (!hasQuiz || moduleAssessment?.passed === true)) {
      phaseCompletionStatus[normalizedPhase].completed += 1;
    }
  });

  // Calculate percentages
  (Object.keys(phaseCompletionStatus) as TrainingPhase[]).forEach((phase) => {
    const stat = phaseCompletionStatus[phase];
    stat.percentComplete = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
  });

  return {
    enrollment,
    modules,
    progress,
    completionMetrics: {
      totalModules,
      completedModules,
      percentComplete,
      phaseCompletionStatus,
    },
  };
}

export async function markModuleStarted(enrollmentId: number, moduleId: number): Promise<TrainingProgress> {
  // Check if progress record exists
  const existing = await pool.query(
    'SELECT * FROM training_progress WHERE enrollment_id = $1 AND module_id = $2',
    [enrollmentId, moduleId]
  );

  if (existing.rows.length > 0) {
    // Update existing record
    const result = await pool.query(
      `UPDATE training_progress
       SET status = $1, started_at = COALESCE(started_at, NOW()), updated_at = NOW()
       WHERE enrollment_id = $2 AND module_id = $3
       RETURNING *`,
      [TrainingProgressStatus.IN_PROGRESS, enrollmentId, moduleId]
    );
    return result.rows[0];
  }

  // Create new progress record
  const result = await pool.query(
    `INSERT INTO training_progress (enrollment_id, module_id, status, started_at, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW(), NOW())
     RETURNING *`,
    [enrollmentId, moduleId, TrainingProgressStatus.IN_PROGRESS]
  );

  return result.rows[0];
}

export async function markModuleCompleted(
  enrollmentId: number,
  moduleId: number,
  timeSpentSeconds?: number
): Promise<{ progress: TrainingProgress; enrollment: TrainingEnrollment }> {
  // Get the module to find its phase
  const moduleResult = await pool.query('SELECT * FROM training_modules WHERE id = $1', [moduleId]);
  if (moduleResult.rows.length === 0) {
    throw new Error('Module not found');
  }
  const module = moduleResult.rows[0];

  // Update progress record
  const progressResult = await pool.query(
    `UPDATE training_progress
     SET status = $1, completed_at = NOW(), time_spent_seconds = COALESCE(time_spent_seconds, 0) + COALESCE($2, 0), updated_at = NOW()
     WHERE enrollment_id = $3 AND module_id = $4
     RETURNING *`,
    [TrainingProgressStatus.COMPLETED, timeSpentSeconds || 0, enrollmentId, moduleId]
  );

  let progress = progressResult.rows[0];

  if (!progress) {
    // Create new progress record if it doesn't exist
    const createResult = await pool.query(
      `INSERT INTO training_progress (enrollment_id, module_id, status, completed_at, time_spent_seconds, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), $4, NOW(), NOW())
       RETURNING *`,
      [enrollmentId, moduleId, TrainingProgressStatus.COMPLETED, timeSpentSeconds || 0]
    );
    progress = createResult.rows[0];
  }

  // Check if all modules in current phase are completed
  const enrollment = await getEnrollmentById(enrollmentId);
  const phaseModulesResult = await pool.query(
    'SELECT id FROM training_modules WHERE role = $1 AND phase = $2',
    [enrollment.role, normalizeTrainingPhase(enrollment.current_phase) ?? TrainingPhase.LEVEL_1_OPERATOR]
  );
  const phaseModuleIds = phaseModulesResult.rows.map((r) => r.id);

  const completedInPhaseResult = await pool.query(
    `SELECT COUNT(*) as count FROM training_progress
     WHERE enrollment_id = $1 AND module_id = ANY($2::int[]) AND status = $3`,
    [enrollmentId, phaseModuleIds, TrainingProgressStatus.COMPLETED]
  );

  const completedInPhase = parseInt(completedInPhaseResult.rows[0].count, 10);

  // If all modules in phase completed, advance to next phase
  let updatedEnrollment = enrollment;
  if (completedInPhase === phaseModuleIds.length && phaseModuleIds.length > 0) {
    const currentPhaseIndex = PHASE_ORDER.indexOf(normalizeTrainingPhase(enrollment.current_phase) ?? TrainingPhase.LEVEL_1_OPERATOR);
    const nextPhaseIndex = currentPhaseIndex + 1;

    if (nextPhaseIndex < PHASE_ORDER.length) {
      // Advance to next phase
      const updateResult = await pool.query(
        `UPDATE training_enrollments
         SET current_phase = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [PHASE_ORDER[nextPhaseIndex], enrollmentId]
      );
      updatedEnrollment = updateResult.rows[0];
    } else {
      // All phases completed - mark enrollment as completed
      const completeResult = await pool.query(
        `UPDATE training_enrollments
         SET status = $1, completed_at = NOW(), updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [TrainingEnrollmentStatus.COMPLETED, enrollmentId]
      );
      updatedEnrollment = completeResult.rows[0];
    }
  }

  await checkAndUpdateCertification(enrollment.user_id);
  return { progress, enrollment: updatedEnrollment };
}

export async function checkAndUpdateCertification(userId: number): Promise<boolean> {
  const userRes = await pool.query('SELECT role, hr_docs_completed, practical_exercise_completed, director_signed_off FROM users WHERE id = $1', [userId]);
  if (userRes.rows.length === 0) return false;
  const user = userRes.rows[0];

  // Admin, Regional Director, Director are exempt
  if (user.role === 'ADMIN' || user.role === 'REGIONAL_DIRECTOR' || user.role === 'DIRECTOR') {
    await pool.query('UPDATE users SET is_certified = true WHERE id = $1', [userId]);
    return true;
  }

  // Check enrollment
  const enrollmentRes = await pool.query('SELECT id, role FROM training_enrollments WHERE user_id = $1', [userId]);
  if (enrollmentRes.rows.length === 0) {
    await pool.query('UPDATE users SET is_certified = false WHERE id = $1', [userId]);
    return false;
  }
  const enrollment = enrollmentRes.rows[0];

  // Count modules vs completed modules
  const modulesRes = await pool.query(
    "SELECT id, quiz_json FROM training_modules WHERE role = $1 AND phase IN ('LEVEL_1_OPERATOR', 'LEVEL_2_PRODUCT')",
    [enrollment.role]
  );
  const progressRes = await pool.query(
    'SELECT module_id FROM training_progress WHERE enrollment_id = $1 AND status = $2',
    [enrollment.id, 'COMPLETED']
  );
  const assessmentRes = await pool.query(
    'SELECT DISTINCT ON (module_id) module_id, passed FROM training_assessments WHERE enrollment_id = $1 ORDER BY module_id, taken_at DESC NULLS LAST, created_at DESC',
    [enrollment.id]
  );

  const completedProgress = new Set(progressRes.rows.map((row) => row.module_id));
  const passedAssessments = new Set(assessmentRes.rows.filter((row) => row.passed).map((row) => row.module_id));
  const totalModules = modulesRes.rows.length;
  const completedModules = modulesRes.rows.filter((module) => {
    const hasQuiz = Array.isArray(module.quiz_json) && module.quiz_json.length > 0;
    return completedProgress.has(module.id) && (!hasQuiz || passedAssessments.has(module.id));
  }).length;

  const modulesCompleted = totalModules > 0 && completedModules >= totalModules;
  const isCertified = modulesCompleted && user.hr_docs_completed && user.practical_exercise_completed && user.director_signed_off;

  await pool.query("UPDATE users SET is_certified = $1, certification_source = 'DATABASE' WHERE id = $2", [isCertified, userId]);
  return isCertified;
}

export async function toggleHrDocs(userId: number, hrDocsCompleted: boolean): Promise<any> {
  await pool.query(
    'UPDATE users SET hr_docs_completed = $1, updated_at = NOW() WHERE id = $2',
    [hrDocsCompleted, userId]
  );
  await checkAndUpdateCertification(userId);
  // Re-fetch to return fresh data (including updated is_certified)
  const fresh = await pool.query(
    'SELECT id, name, hr_docs_completed, practical_exercise_completed, director_signed_off, is_certified FROM users WHERE id = $1',
    [userId]
  );
  return fresh.rows[0];
}

export async function togglePracticalExercise(userId: number, practicalExerciseCompleted: boolean): Promise<any> {
  await pool.query(
    'UPDATE users SET practical_exercise_completed = $1, updated_at = NOW() WHERE id = $2',
    [practicalExerciseCompleted, userId]
  );
  await checkAndUpdateCertification(userId);
  // Re-fetch to return fresh data (including updated is_certified)
  const fresh = await pool.query(
    'SELECT id, name, hr_docs_completed, practical_exercise_completed, director_signed_off, is_certified FROM users WHERE id = $1',
    [userId]
  );
  return fresh.rows[0];
}

export async function toggleDirectorSignoff(userId: number, directorSignedOff: boolean): Promise<any> {
  await pool.query(
    'UPDATE users SET director_signed_off = $1, updated_at = NOW() WHERE id = $2',
    [directorSignedOff, userId]
  );
  await checkAndUpdateCertification(userId);
  // Re-fetch to return fresh data (including updated is_certified)
  const fresh = await pool.query(
    'SELECT id, name, hr_docs_completed, practical_exercise_completed, director_signed_off, is_certified FROM users WHERE id = $1',
    [userId]
  );
  return fresh.rows[0];
}

export async function submitModuleAssessment(enrollmentId: number, moduleId: number, answers: string[]): Promise<any> {
  const moduleResult = await pool.query('SELECT id, quiz_json, passing_score FROM training_modules WHERE id = $1', [moduleId]);
  if (moduleResult.rows.length === 0) throw new Error('Module not found');
  const module = moduleResult.rows[0];
  const questions = Array.isArray(module.quiz_json) ? module.quiz_json : [];
  if (!questions.length) throw new Error('Module has no quiz');

  const correct = questions.reduce((count: number, question: any, index: number) => count + (answers[index] === question.correctAnswer ? 1 : 0), 0);
  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= (module.passing_score ?? 85);
  const result = await pool.query(
    `INSERT INTO training_assessments (module_id, enrollment_id, score, passed, taken_at, created_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING *`,
    [moduleId, enrollmentId, score, passed]
  );
  const enrollment = await getEnrollmentById(enrollmentId);
  await checkAndUpdateCertification(enrollment.user_id);
  return result.rows[0];
}

export async function resolveUserId(id: string | number): Promise<number> {
  // Only treat as a numeric DB id if it's a safe positive integer within PostgreSQL SERIAL range
  const strId = String(id).trim();
  if (/^\d+$/.test(strId)) {
    const numericId = parseInt(strId, 10);
    if (numericId >= 1 && numericId <= 2147483647) {
      return numericId;
    }
    throw new Error(`Numeric ID out of valid range: ${id}`);
  }

  const emailMap: Record<string, string> = {
    'u-owner-coach-bradshaw': 'abradshaw@tufsports.us',
    'u-director-primeau-hill': 'primeau.hill@tufsports.us',
    'u-rep-jason-mulder': 'jason@tufsports.us', // Production database mapping
    'u-rep-david-lundberg': 'lundbergdave18@gmail.com',
    'u-rep-shayla-hilliard': 'shaylahilliard17@gmail.com',
    'u-rep-josh-hoffman': 'jhoffman@kipsu.com',
  };

  const email = emailMap[String(id)];
  if (email) {
    const result = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (result.rows[0]) {
      return result.rows[0].id;
    }
  }

  const namePart = String(id).replace(/^u-(rep|director|owner)-/, '').replace(/-/g, ' ');
  const result = await pool.query('SELECT id FROM users WHERE LOWER(name) = LOWER($1)', [namePart]);
  if (result.rows[0]) {
    return result.rows[0].id;
  }

  // Fallback email lookup for Jason Mulder
  if (namePart.includes('jason mulder')) {
    const resFallback = await pool.query("SELECT id FROM users WHERE LOWER(email) = 'jason@tufsports.us'");
    if (resFallback.rows[0]) {
      return resFallback.rows[0].id;
    }
  }

  throw new Error('User not found');
}

export async function getCertificationStatus(userId: number | string): Promise<any> {
  console.log(`[certification-status] RAW ID PARAM RECEIVED: ${userId}`);
  let dbUserId: number;
  try {
    dbUserId = await resolveUserId(userId);
    console.log(`[certification-status] RESOLVED USER ID: ${dbUserId}`);
  } catch (err: any) {
    console.error(`[certification-status] FAILED TO RESOLVE USER ID: ${userId}. Error: ${err.message}`, err.stack);
    throw err;
  }

  const userRes = await pool.query(
    'SELECT id, name, role, hr_docs_completed, practical_exercise_completed, director_signed_off, is_certified FROM users WHERE id = $1',
    [dbUserId]
  );
  if (userRes.rows.length === 0) {
    console.warn(`[certification-status] USER LOOKUP RESULT: NOT FOUND in database for resolved ID ${dbUserId}`);
    throw new Error('User not found');
  }
  const user = userRes.rows[0];
  console.log(`[certification-status] USER LOOKUP RESULT: FOUND user_id=${user.id}, name="${user.name}", role="${user.role}"`);

  let modulesPercent = 0;
  let totalModules = 0;
  let completedModules = 0;

  const enrollmentRes = await pool.query('SELECT id, role, enrolled_at FROM training_enrollments WHERE user_id = $1', [dbUserId]);
  console.log(`[certification-status] ENROLLMENT LOOKUP RESULT: Found ${enrollmentRes.rows.length} enrollment(s) for user_id=${dbUserId}`);

  let enrolledAt: string | null = null;
  let isOverdue = false;

  if (enrollmentRes.rows.length > 0) {
    const enrollment = enrollmentRes.rows[0];
    enrolledAt = enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toISOString() : null;
    
    if (enrollment.enrolled_at && !user.is_certified) {
      const elapsedMs = Date.now() - new Date(enrollment.enrolled_at).getTime();
      if (elapsedMs > 72 * 60 * 60 * 1000) {
        isOverdue = true;
        console.warn(`[TUF ACADEMY] CERTIFICATION OVERDUE ALERT: Sales rep "${user.name}" (ID: ${user.id}) has exceeded the 72-hour certification limit! State Director has been notified.`);
      }
    }

    console.log(`[certification-status] ENROLLMENT DETAIL: enrollment_id=${enrollment.id}, role="${enrollment.role}", enrolled_at="${enrolledAt}", isOverdue=${isOverdue}`);

    const modulesRes = await pool.query(
      "SELECT id, quiz_json FROM training_modules WHERE role = $1 AND phase IN ('LEVEL_1_OPERATOR', 'LEVEL_2_PRODUCT')",
      [enrollment.role]
    );
    console.log(`[certification-status] MODULE COUNT: Found ${modulesRes.rows.length} modules for role="${enrollment.role}"`);

    const progressRes = await pool.query(
      'SELECT module_id FROM training_progress WHERE enrollment_id = $1 AND status = $2',
      [enrollment.id, 'COMPLETED']
    );
    console.log(`[certification-status] PROGRESS COUNT: Found ${progressRes.rows.length} completed progress rows for enrollment_id=${enrollment.id}`);

    const assessmentRes = await pool.query(
      'SELECT DISTINCT ON (module_id) module_id, passed FROM training_assessments WHERE enrollment_id = $1 ORDER BY module_id, taken_at DESC NULLS LAST, created_at DESC',
      [enrollment.id]
    );

    const completedProgress = new Set(progressRes.rows.map((row) => row.module_id));
    const passedAssessments = new Set(assessmentRes.rows.filter((row) => row.passed).map((row) => row.module_id));
    totalModules = modulesRes.rows.length;
    completedModules = modulesRes.rows.filter((module) => {
      const hasQuiz = Array.isArray(module.quiz_json) && module.quiz_json.length > 0;
      return completedProgress.has(module.id) && (!hasQuiz || passedAssessments.has(module.id));
    }).length;
    modulesPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  }

  return {
    userId: typeof userId === 'string' && isNaN(Number(userId)) ? userId : user.id,
    name: user.name,
    role: user.role,
    hrDocsCompleted: user.hr_docs_completed,
    practicalExerciseCompleted: user.practical_exercise_completed,
    directorSignedOff: user.director_signed_off,
    isCertified: user.is_certified,
    modulesPercent,
    modulesCompleted: totalModules > 0 && completedModules >= totalModules,
    completedModules,
    totalModules,
    enrolledAt,
    isOverdue
  };
}

export async function getEnrollmentById(enrollmentId: number): Promise<TrainingEnrollment> {
  const result = await pool.query('SELECT * FROM training_enrollments WHERE id = $1', [enrollmentId]);
  if (result.rows.length === 0) {
    throw new Error('Enrollment not found');
  }
  return result.rows[0];
}

export async function getUserEnrollment(userId: number): Promise<TrainingEnrollment | null> {
  const result = await pool.query('SELECT * FROM training_enrollments WHERE user_id = $1', [userId]);
  if (result.rows.length > 0) {
    return result.rows[0];
  }

  // Try to find the user in users table to get their role and auto-enroll them
  const userRes = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  if (userRes.rows[0]) {
    let role = String(userRes.rows[0].role || 'REP').toUpperCase();
    // Normalize roles to valid training enrollment roles
    if (role === 'SALES_REP') {
      role = 'REP';
    } else if (role === 'ADMIN' || role === 'OWNER') {
      role = 'ADMIN';
    } else if (role === 'REGIONAL_DIRECTOR') {
      role = 'DIRECTOR';
    }
    return await enrollUserInTraining(userId, role as any);
  }

  return null;
}

export async function getProgressByEnrollment(enrollmentId: number): Promise<TrainingProgress[]> {
  const result = await pool.query(
    'SELECT * FROM training_progress WHERE enrollment_id = $1 ORDER BY created_at ASC',
    [enrollmentId]
  );
  return result.rows;
}

export async function recordFrictionPoint(
  enrollmentId: number,
  frictionPointText: string,
  moduleId?: number,
  resolutionText?: string
): Promise<void> {
  await pool.query(
    `INSERT INTO training_friction_notes (enrollment_id, module_id, friction_point_text, resolution_text, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [enrollmentId, moduleId || null, frictionPointText, resolutionText || null]
  );
}

export async function getFrictionPoints(): Promise<any[]> {
  const result = await pool.query(`
    SELECT fn.*, tm.title as module_title, u.name as rep_name, u.email as rep_email
    FROM training_friction_notes fn
    LEFT JOIN training_modules tm ON fn.module_id = tm.id
    JOIN training_enrollments te ON fn.enrollment_id = te.id
    JOIN users u ON te.user_id = u.id
    ORDER BY fn.created_at DESC
  `);
  return result.rows;
}
