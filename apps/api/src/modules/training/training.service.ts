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
} from './training.interface';

const PHASE_ORDER = [TrainingPhase.DAY_1, TrainingPhase.DAY_1_2, TrainingPhase.WEEK_1_2, TrainingPhase.MONTH_1];

function persistedTrainingRole(role: TrainingRole): TrainingRole {
  return role === TrainingRole.REP ? TrainingRole.TAE : role;
}

export async function getModulesByRole(role: TrainingRole, phase?: TrainingPhase): Promise<TrainingModule[]> {
  let query = 'SELECT * FROM training_modules WHERE role = $1';
  const params: any[] = [persistedTrainingRole(role)];

  if (phase) {
    query += ' AND phase = $2';
    params.push(phase);
  }

  query += ' ORDER BY order_index ASC';
  const result = await pool.query(query, params);
  return result.rows;
}

export async function enrollUserInTraining(userId: number, role: TrainingRole): Promise<TrainingEnrollment> {
  const enrollmentRole = persistedTrainingRole(role);

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
    [userId, enrollmentRole, TrainingEnrollmentStatus.ACTIVE, TrainingPhase.DAY_1]
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
    'SELECT * FROM training_modules WHERE role = $1 ORDER BY order_index ASC',
    [enrollment.role]
  );
  const modules = modulesResult.rows as TrainingModule[];

  // Get progress for all modules
  const progressResult = await pool.query(
    'SELECT * FROM training_progress WHERE enrollment_id = $1',
    [enrollmentId]
  );
  const progress = progressResult.rows;

  // Calculate completion metrics
  const totalModules = modules.length;
  const completedModules = progress.filter((p) => p.status === TrainingProgressStatus.COMPLETED).length;
  const percentComplete = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  // Calculate phase completion status
  const phaseCompletionStatus: Record<TrainingPhase, { completed: number; total: number; percentComplete: number }> = {
    [TrainingPhase.DAY_1]: { completed: 0, total: 0, percentComplete: 0 },
    [TrainingPhase.DAY_1_2]: { completed: 0, total: 0, percentComplete: 0 },
    [TrainingPhase.WEEK_1_2]: { completed: 0, total: 0, percentComplete: 0 },
    [TrainingPhase.MONTH_1]: { completed: 0, total: 0, percentComplete: 0 },
  };

  modules.forEach((module) => {
    phaseCompletionStatus[module.phase].total += 1;
    const moduleProgress = progress.find((p) => p.module_id === module.id);
    if (moduleProgress && moduleProgress.status === TrainingProgressStatus.COMPLETED) {
      phaseCompletionStatus[module.phase].completed += 1;
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
    [enrollment.role, enrollment.current_phase]
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
    const currentPhaseIndex = PHASE_ORDER.indexOf(enrollment.current_phase);
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
  const userRes = await pool.query('SELECT role, hr_docs_completed, director_signed_off FROM users WHERE id = $1', [userId]);
  if (userRes.rows.length === 0) return false;
  const user = userRes.rows[0];

  // Owner, Director, Ops are exempt
  if (user.role === 'OWNER' || user.role === 'DIRECTOR' || user.role === 'OPS') {
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
  const modulesRes = await pool.query('SELECT COUNT(*) as count FROM training_modules WHERE role = $1', [enrollment.role]);
  const progressRes = await pool.query(
    'SELECT COUNT(*) as count FROM training_progress WHERE enrollment_id = $1 AND status = $2',
    [enrollment.id, 'COMPLETED']
  );

  const totalModules = parseInt(modulesRes.rows[0].count, 10);
  const completedModules = parseInt(progressRes.rows[0].count, 10);

  const modulesCompleted = totalModules > 0 && completedModules >= totalModules;
  const isCertified = modulesCompleted && user.hr_docs_completed && user.director_signed_off;

  await pool.query('UPDATE users SET is_certified = $1 WHERE id = $2', [isCertified, userId]);
  return isCertified;
}

export async function toggleHrDocs(userId: number, hrDocsCompleted: boolean): Promise<any> {
  const result = await pool.query(
    'UPDATE users SET hr_docs_completed = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, hr_docs_completed, director_signed_off, is_certified',
    [hrDocsCompleted, userId]
  );
  await checkAndUpdateCertification(userId);
  return result.rows[0];
}

export async function toggleDirectorSignoff(userId: number, directorSignedOff: boolean): Promise<any> {
  const result = await pool.query(
    'UPDATE users SET director_signed_off = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, hr_docs_completed, director_signed_off, is_certified',
    [directorSignedOff, userId]
  );
  await checkAndUpdateCertification(userId);
  return result.rows[0];
}

export async function getCertificationStatus(userId: number): Promise<any> {
  const userRes = await pool.query(
    'SELECT id, name, role, hr_docs_completed, director_signed_off, is_certified FROM users WHERE id = $1',
    [userId]
  );
  if (userRes.rows.length === 0) {
    throw new Error('User not found');
  }
  const user = userRes.rows[0];

  let modulesPercent = 0;
  let totalModules = 0;
  let completedModules = 0;

  const enrollmentRes = await pool.query('SELECT id, role FROM training_enrollments WHERE user_id = $1', [userId]);
  if (enrollmentRes.rows.length > 0) {
    const enrollment = enrollmentRes.rows[0];
    const modulesRes = await pool.query('SELECT COUNT(*) as count FROM training_modules WHERE role = $1', [enrollment.role]);
    const progressRes = await pool.query(
      'SELECT COUNT(*) as count FROM training_progress WHERE enrollment_id = $1 AND status = $2',
      [enrollment.id, 'COMPLETED']
    );
    totalModules = parseInt(modulesRes.rows[0].count, 10);
    completedModules = parseInt(progressRes.rows[0].count, 10);
    modulesPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  }

  return {
    userId: user.id,
    name: user.name,
    role: user.role,
    hrDocsCompleted: user.hr_docs_completed,
    directorSignedOff: user.director_signed_off,
    isCertified: user.is_certified,
    modulesPercent,
    modulesCompleted: totalModules > 0 && completedModules >= totalModules,
    completedModules,
    totalModules
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
  return result.rows.length > 0 ? result.rows[0] : null;
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
