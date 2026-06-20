const fs = require('fs');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const trainingInterface = read('apps/api/src/modules/training/training.interface.ts');
const enumBlock = trainingInterface.match(/export enum TrainingPhase \{([\s\S]*?)\n\}/)?.[1] || '';
const enumKeys = [...enumBlock.matchAll(/^\s*([A-Z0-9_]+)\s*=/gm)].map((match) => match[1]);
assert(JSON.stringify(enumKeys) === JSON.stringify([
  'LEVEL_1_OPERATOR',
  'LEVEL_2_PRODUCT',
  'LEVEL_3_TERRITORY',
  'LEVEL_4_SALES',
  'LEVEL_5_EXPANSION',
  'SPECIALIZED_TRACKS',
  'LEVEL_7_DIRECTOR',
  'MARKET_MASTERY',
]), `TrainingPhase enum is not canonical-only: ${enumKeys.join(', ')}`);
assert(trainingInterface.includes('LEGACY_PHASE_MAP'), 'LEGACY_PHASE_MAP is missing');

const trainingService = read('apps/api/src/modules/training/training.service.ts');
assert(trainingService.includes('normalizeTrainingPhase(module.phase)'), 'Phase completion does not normalize module phases');
assert(trainingService.includes('if (!normalizedPhase)'), 'Phase completion does not guard unknown phases');
assert(trainingService.includes('modulesCompleted && user.hr_docs_completed && user.practical_exercise_completed && user.director_signed_off'), 'Certification does not require all launch gate prerequisites');
assert(trainingService.includes('togglePracticalExercise'), 'Practical exercise service method is missing');

const trainingRoutes = read('apps/api/src/modules/training/training.routes.ts');
assert(trainingRoutes.includes("/reps/:id/practical-exercise"), 'Practical exercise route is missing');

const trainingController = read('apps/api/src/modules/training/training.controller.ts');
assert(trainingController.includes('canManageRepCertification'), 'Practical exercise permission guard is missing');

const ordersService = read('apps/api/src/modules/orders/orders.service.ts');
assert(ordersService.includes('assigned_rep_id, assigned_director_id'), 'Closed Won order insert does not include rep/director scope columns');
assert(ordersService.includes('errorOnDuplicate === false'), 'Order duplicate idempotency path is missing');

const app = read('apps/web/src/App.tsx');
assert(app.includes("!['/training', '/dashboard'].includes(path)"), 'Uncertified rep routing gate does not allow only Academy/dashboard');
assert(app.includes('PageProtected user={user} path="/dashboard"'), 'Dashboard is not routed through PageProtected');

const enrollmentHook = read('apps/web/src/hooks/useTrainingEnrollment.ts');
assert(enrollmentHook.includes('if (IS_PRODUCTION)'), 'Production Academy fallback guard is missing');
assert(enrollmentHook.includes('Local fallback is disabled'), 'Production fallback error is not explicit');

const migration = read('packages/database/migrations/1900000009000_v090_production_readiness_gates.js');
assert(migration.includes("to_regclass('public.users')"), 'Migration does not guard users table existence');
assert(migration.includes('ADD COLUMN IF NOT EXISTS practical_exercise_completed'), 'Migration does not idempotently add practical_exercise_completed');
assert(migration.includes('ADD COLUMN IF NOT EXISTS assigned_rep_id'), 'Migration does not ensure order assigned_rep_id exists');
assert(migration.includes("column_name = 'updated_at'"), 'Migration does not guard orders.updated_at before backfill update timestamp');

console.log('v0.9.0 launch safety validation passed');
