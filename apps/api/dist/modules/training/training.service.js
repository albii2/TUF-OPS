"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModulesByRole = getModulesByRole;
exports.enrollUserInTraining = enrollUserInTraining;
exports.getEnrollmentWithProgress = getEnrollmentWithProgress;
exports.markModuleStarted = markModuleStarted;
exports.markModuleCompleted = markModuleCompleted;
exports.checkAndUpdateCertification = checkAndUpdateCertification;
exports.toggleHrDocs = toggleHrDocs;
exports.togglePracticalExercise = togglePracticalExercise;
exports.toggleDirectorSignoff = toggleDirectorSignoff;
exports.submitModuleAssessment = submitModuleAssessment;
exports.getCertificationStatus = getCertificationStatus;
exports.getEnrollmentById = getEnrollmentById;
exports.getUserEnrollment = getUserEnrollment;
exports.getProgressByEnrollment = getProgressByEnrollment;
exports.recordFrictionPoint = recordFrictionPoint;
const database_1 = require("@packages/database");
const training_interface_1 = require("./training.interface");
const PHASE_ORDER = [
    training_interface_1.TrainingPhase.LEVEL_1_OPERATOR,
    training_interface_1.TrainingPhase.LEVEL_2_PRODUCT,
    training_interface_1.TrainingPhase.LEVEL_3_TERRITORY,
    training_interface_1.TrainingPhase.LEVEL_4_SALES,
    training_interface_1.TrainingPhase.LEVEL_5_EXPANSION,
    training_interface_1.TrainingPhase.SPECIALIZED_TRACKS,
    training_interface_1.TrainingPhase.LEVEL_7_DIRECTOR,
    training_interface_1.TrainingPhase.MARKET_MASTERY,
];
const CANONICAL_PHASES = new Set(PHASE_ORDER);
function normalizeTrainingPhase(phase) {
    if (CANONICAL_PHASES.has(phase))
        return phase;
    return training_interface_1.LEGACY_PHASE_MAP[phase] ?? null;
}
function canonicalTrainingRole(role) {
    return role === training_interface_1.TrainingRole.TAE ? training_interface_1.TrainingRole.REP : role;
}
async function getModulesByRole(role, phase) {
    let query = 'SELECT * FROM training_modules WHERE role = $1';
    const params = [canonicalTrainingRole(role)];
    if (phase) {
        query += ' AND phase = $2';
        params.push(phase);
    }
    query += ' ORDER BY order_index ASC';
    const result = await database_1.pool.query(query, params);
    return result.rows;
}
async function enrollUserInTraining(userId, role) {
    const enrollmentRole = canonicalTrainingRole(role);
    // Check if user already enrolled
    const existing = await database_1.pool.query('SELECT * FROM training_enrollments WHERE user_id = $1', [userId]);
    if (existing.rows.length > 0) {
        return existing.rows[0];
    }
    // Create new enrollment
    const result = await database_1.pool.query(`INSERT INTO training_enrollments (user_id, role, status, current_phase, enrolled_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())
     RETURNING *`, [userId, enrollmentRole, training_interface_1.TrainingEnrollmentStatus.ACTIVE, training_interface_1.TrainingPhase.LEVEL_1_OPERATOR]);
    return result.rows[0];
}
async function getEnrollmentWithProgress(enrollmentId) {
    // Get enrollment
    const enrollmentResult = await database_1.pool.query('SELECT * FROM training_enrollments WHERE id = $1', [enrollmentId]);
    if (enrollmentResult.rows.length === 0) {
        throw new Error('Enrollment not found');
    }
    const enrollment = enrollmentResult.rows[0];
    // Get all modules for this role
    const modulesResult = await database_1.pool.query('SELECT * FROM training_modules WHERE role = $1 ORDER BY order_index ASC', [enrollment.role]);
    const modules = modulesResult.rows;
    // Get latest quiz/assessment result for all modules
    const assessmentResult = await database_1.pool.query('SELECT DISTINCT ON (module_id) * FROM training_assessments WHERE enrollment_id = $1 ORDER BY module_id, taken_at DESC NULLS LAST, created_at DESC', [enrollmentId]);
    const assessmentByModule = new Map(assessmentResult.rows.map((row) => [row.module_id, row]));
    // Get progress for all modules
    const progressResult = await database_1.pool.query('SELECT * FROM training_progress WHERE enrollment_id = $1', [enrollmentId]);
    const progress = progressResult.rows;
    // Calculate completion metrics
    const totalModules = modules.length;
    const completedModules = modules.filter((module) => {
        const moduleProgress = progress.find((p) => p.module_id === module.id);
        const moduleAssessment = assessmentByModule.get(module.id);
        const hasQuiz = Array.isArray(module.quiz_json) && module.quiz_json.length > 0;
        return moduleProgress?.status === training_interface_1.TrainingProgressStatus.COMPLETED && (!hasQuiz || moduleAssessment?.passed === true);
    }).length;
    const percentComplete = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
    // Calculate phase completion status
    const phaseCompletionStatus = {
        [training_interface_1.TrainingPhase.LEVEL_1_OPERATOR]: { completed: 0, total: 0, percentComplete: 0 },
        [training_interface_1.TrainingPhase.LEVEL_2_PRODUCT]: { completed: 0, total: 0, percentComplete: 0 },
        [training_interface_1.TrainingPhase.LEVEL_3_TERRITORY]: { completed: 0, total: 0, percentComplete: 0 },
        [training_interface_1.TrainingPhase.LEVEL_4_SALES]: { completed: 0, total: 0, percentComplete: 0 },
        [training_interface_1.TrainingPhase.LEVEL_5_EXPANSION]: { completed: 0, total: 0, percentComplete: 0 },
        [training_interface_1.TrainingPhase.SPECIALIZED_TRACKS]: { completed: 0, total: 0, percentComplete: 0 },
        [training_interface_1.TrainingPhase.LEVEL_7_DIRECTOR]: { completed: 0, total: 0, percentComplete: 0 },
        [training_interface_1.TrainingPhase.MARKET_MASTERY]: { completed: 0, total: 0, percentComplete: 0 },
    };
    modules.forEach((module) => {
        const normalizedPhase = normalizeTrainingPhase(module.phase);
        if (!normalizedPhase) {
            console.warn(`Skipping training module ${module.id} with unknown phase ${module.phase}`);
            return;
        }
        phaseCompletionStatus[normalizedPhase].total += 1;
        const moduleProgress = progress.find((p) => p.module_id === module.id);
        const moduleAssessment = assessmentByModule.get(module.id);
        const hasQuiz = Array.isArray(module.quiz_json) && module.quiz_json.length > 0;
        if (moduleProgress && moduleProgress.status === training_interface_1.TrainingProgressStatus.COMPLETED && (!hasQuiz || moduleAssessment?.passed === true)) {
            phaseCompletionStatus[normalizedPhase].completed += 1;
        }
    });
    // Calculate percentages
    Object.keys(phaseCompletionStatus).forEach((phase) => {
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
async function markModuleStarted(enrollmentId, moduleId) {
    // Check if progress record exists
    const existing = await database_1.pool.query('SELECT * FROM training_progress WHERE enrollment_id = $1 AND module_id = $2', [enrollmentId, moduleId]);
    if (existing.rows.length > 0) {
        // Update existing record
        const result = await database_1.pool.query(`UPDATE training_progress
       SET status = $1, started_at = COALESCE(started_at, NOW()), updated_at = NOW()
       WHERE enrollment_id = $2 AND module_id = $3
       RETURNING *`, [training_interface_1.TrainingProgressStatus.IN_PROGRESS, enrollmentId, moduleId]);
        return result.rows[0];
    }
    // Create new progress record
    const result = await database_1.pool.query(`INSERT INTO training_progress (enrollment_id, module_id, status, started_at, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW(), NOW())
     RETURNING *`, [enrollmentId, moduleId, training_interface_1.TrainingProgressStatus.IN_PROGRESS]);
    return result.rows[0];
}
async function markModuleCompleted(enrollmentId, moduleId, timeSpentSeconds) {
    // Get the module to find its phase
    const moduleResult = await database_1.pool.query('SELECT * FROM training_modules WHERE id = $1', [moduleId]);
    if (moduleResult.rows.length === 0) {
        throw new Error('Module not found');
    }
    const module = moduleResult.rows[0];
    // Update progress record
    const progressResult = await database_1.pool.query(`UPDATE training_progress
     SET status = $1, completed_at = NOW(), time_spent_seconds = COALESCE(time_spent_seconds, 0) + COALESCE($2, 0), updated_at = NOW()
     WHERE enrollment_id = $3 AND module_id = $4
     RETURNING *`, [training_interface_1.TrainingProgressStatus.COMPLETED, timeSpentSeconds || 0, enrollmentId, moduleId]);
    let progress = progressResult.rows[0];
    if (!progress) {
        // Create new progress record if it doesn't exist
        const createResult = await database_1.pool.query(`INSERT INTO training_progress (enrollment_id, module_id, status, completed_at, time_spent_seconds, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), $4, NOW(), NOW())
       RETURNING *`, [enrollmentId, moduleId, training_interface_1.TrainingProgressStatus.COMPLETED, timeSpentSeconds || 0]);
        progress = createResult.rows[0];
    }
    // Check if all modules in current phase are completed
    const enrollment = await getEnrollmentById(enrollmentId);
    const phaseModulesResult = await database_1.pool.query('SELECT id FROM training_modules WHERE role = $1 AND phase = $2', [enrollment.role, normalizeTrainingPhase(enrollment.current_phase) ?? training_interface_1.TrainingPhase.LEVEL_1_OPERATOR]);
    const phaseModuleIds = phaseModulesResult.rows.map((r) => r.id);
    const completedInPhaseResult = await database_1.pool.query(`SELECT COUNT(*) as count FROM training_progress
     WHERE enrollment_id = $1 AND module_id = ANY($2::int[]) AND status = $3`, [enrollmentId, phaseModuleIds, training_interface_1.TrainingProgressStatus.COMPLETED]);
    const completedInPhase = parseInt(completedInPhaseResult.rows[0].count, 10);
    // If all modules in phase completed, advance to next phase
    let updatedEnrollment = enrollment;
    if (completedInPhase === phaseModuleIds.length && phaseModuleIds.length > 0) {
        const currentPhaseIndex = PHASE_ORDER.indexOf(normalizeTrainingPhase(enrollment.current_phase) ?? training_interface_1.TrainingPhase.LEVEL_1_OPERATOR);
        const nextPhaseIndex = currentPhaseIndex + 1;
        if (nextPhaseIndex < PHASE_ORDER.length) {
            // Advance to next phase
            const updateResult = await database_1.pool.query(`UPDATE training_enrollments
         SET current_phase = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`, [PHASE_ORDER[nextPhaseIndex], enrollmentId]);
            updatedEnrollment = updateResult.rows[0];
        }
        else {
            // All phases completed - mark enrollment as completed
            const completeResult = await database_1.pool.query(`UPDATE training_enrollments
         SET status = $1, completed_at = NOW(), updated_at = NOW()
         WHERE id = $2
         RETURNING *`, [training_interface_1.TrainingEnrollmentStatus.COMPLETED, enrollmentId]);
            updatedEnrollment = completeResult.rows[0];
        }
    }
    await checkAndUpdateCertification(enrollment.user_id);
    return { progress, enrollment: updatedEnrollment };
}
async function checkAndUpdateCertification(userId) {
    const userRes = await database_1.pool.query('SELECT role, hr_docs_completed, practical_exercise_completed, director_signed_off FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0)
        return false;
    const user = userRes.rows[0];
    // Admin, Regional Director, Director are exempt
    if (user.role === 'ADMIN' || user.role === 'REGIONAL_DIRECTOR' || user.role === 'DIRECTOR') {
        await database_1.pool.query('UPDATE users SET is_certified = true WHERE id = $1', [userId]);
        return true;
    }
    // Check enrollment
    const enrollmentRes = await database_1.pool.query('SELECT id, role FROM training_enrollments WHERE user_id = $1', [userId]);
    if (enrollmentRes.rows.length === 0) {
        await database_1.pool.query('UPDATE users SET is_certified = false WHERE id = $1', [userId]);
        return false;
    }
    const enrollment = enrollmentRes.rows[0];
    // Count modules vs completed modules
    const modulesRes = await database_1.pool.query('SELECT id, quiz_json FROM training_modules WHERE role = $1', [enrollment.role]);
    const progressRes = await database_1.pool.query('SELECT module_id FROM training_progress WHERE enrollment_id = $1 AND status = $2', [enrollment.id, 'COMPLETED']);
    const assessmentRes = await database_1.pool.query('SELECT DISTINCT ON (module_id) module_id, passed FROM training_assessments WHERE enrollment_id = $1 ORDER BY module_id, taken_at DESC NULLS LAST, created_at DESC', [enrollment.id]);
    const completedProgress = new Set(progressRes.rows.map((row) => row.module_id));
    const passedAssessments = new Set(assessmentRes.rows.filter((row) => row.passed).map((row) => row.module_id));
    const totalModules = modulesRes.rows.length;
    const completedModules = modulesRes.rows.filter((module) => {
        const hasQuiz = Array.isArray(module.quiz_json) && module.quiz_json.length > 0;
        return completedProgress.has(module.id) && (!hasQuiz || passedAssessments.has(module.id));
    }).length;
    const modulesCompleted = totalModules > 0 && completedModules >= totalModules;
    const isCertified = modulesCompleted && user.hr_docs_completed && user.practical_exercise_completed && user.director_signed_off;
    await database_1.pool.query("UPDATE users SET is_certified = $1, certification_source = 'DATABASE' WHERE id = $2", [isCertified, userId]);
    return isCertified;
}
async function toggleHrDocs(userId, hrDocsCompleted) {
    const result = await database_1.pool.query('UPDATE users SET hr_docs_completed = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, hr_docs_completed, director_signed_off, is_certified', [hrDocsCompleted, userId]);
    await checkAndUpdateCertification(userId);
    return result.rows[0];
}
async function togglePracticalExercise(userId, practicalExerciseCompleted) {
    const result = await database_1.pool.query('UPDATE users SET practical_exercise_completed = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, hr_docs_completed, practical_exercise_completed, director_signed_off, is_certified', [practicalExerciseCompleted, userId]);
    await checkAndUpdateCertification(userId);
    return result.rows[0];
}
async function toggleDirectorSignoff(userId, directorSignedOff) {
    const result = await database_1.pool.query('UPDATE users SET director_signed_off = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, hr_docs_completed, director_signed_off, is_certified', [directorSignedOff, userId]);
    await checkAndUpdateCertification(userId);
    return result.rows[0];
}
async function submitModuleAssessment(enrollmentId, moduleId, answers) {
    const moduleResult = await database_1.pool.query('SELECT id, quiz_json, passing_score FROM training_modules WHERE id = $1', [moduleId]);
    if (moduleResult.rows.length === 0)
        throw new Error('Module not found');
    const module = moduleResult.rows[0];
    const questions = Array.isArray(module.quiz_json) ? module.quiz_json : [];
    if (!questions.length)
        throw new Error('Module has no quiz');
    const correct = questions.reduce((count, question, index) => count + (answers[index] === question.correctAnswer ? 1 : 0), 0);
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= (module.passing_score ?? 85);
    const result = await database_1.pool.query(`INSERT INTO training_assessments (module_id, enrollment_id, score, passed, taken_at, created_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING *`, [moduleId, enrollmentId, score, passed]);
    const enrollment = await getEnrollmentById(enrollmentId);
    await checkAndUpdateCertification(enrollment.user_id);
    return result.rows[0];
}
async function getCertificationStatus(userId) {
    const userRes = await database_1.pool.query('SELECT id, name, role, hr_docs_completed, practical_exercise_completed, director_signed_off, is_certified FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
        throw new Error('User not found');
    }
    const user = userRes.rows[0];
    let modulesPercent = 0;
    let totalModules = 0;
    let completedModules = 0;
    const enrollmentRes = await database_1.pool.query('SELECT id, role FROM training_enrollments WHERE user_id = $1', [userId]);
    if (enrollmentRes.rows.length > 0) {
        const enrollment = enrollmentRes.rows[0];
        const modulesRes = await database_1.pool.query('SELECT id, quiz_json FROM training_modules WHERE role = $1', [enrollment.role]);
        const progressRes = await database_1.pool.query('SELECT module_id FROM training_progress WHERE enrollment_id = $1 AND status = $2', [enrollment.id, 'COMPLETED']);
        const assessmentRes = await database_1.pool.query('SELECT DISTINCT ON (module_id) module_id, passed FROM training_assessments WHERE enrollment_id = $1 ORDER BY module_id, taken_at DESC NULLS LAST, created_at DESC', [enrollment.id]);
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
        userId: user.id,
        name: user.name,
        role: user.role,
        hrDocsCompleted: user.hr_docs_completed,
        practicalExerciseCompleted: user.practical_exercise_completed,
        directorSignedOff: user.director_signed_off,
        isCertified: user.is_certified,
        modulesPercent,
        modulesCompleted: totalModules > 0 && completedModules >= totalModules,
        completedModules,
        totalModules
    };
}
async function getEnrollmentById(enrollmentId) {
    const result = await database_1.pool.query('SELECT * FROM training_enrollments WHERE id = $1', [enrollmentId]);
    if (result.rows.length === 0) {
        throw new Error('Enrollment not found');
    }
    return result.rows[0];
}
async function getUserEnrollment(userId) {
    const result = await database_1.pool.query('SELECT * FROM training_enrollments WHERE user_id = $1', [userId]);
    return result.rows.length > 0 ? result.rows[0] : null;
}
async function getProgressByEnrollment(enrollmentId) {
    const result = await database_1.pool.query('SELECT * FROM training_progress WHERE enrollment_id = $1 ORDER BY created_at ASC', [enrollmentId]);
    return result.rows;
}
async function recordFrictionPoint(enrollmentId, frictionPointText, moduleId, resolutionText) {
    await database_1.pool.query(`INSERT INTO training_friction_notes (enrollment_id, module_id, friction_point_text, resolution_text, created_at)
     VALUES ($1, $2, $3, $4, NOW())`, [enrollmentId, moduleId || null, frictionPointText, resolutionText || null]);
}
//# sourceMappingURL=training.service.js.map