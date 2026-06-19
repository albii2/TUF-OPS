const fs = require('fs');

const REQUIRED_DOCS = [
  'docs/V0_9_0_PRODUCTION_READINESS.md',
  'docs/V0_9_0_LAUNCH_SMOKE_TEST.md',
  'docs/V0_9_0_PRODUCTION_DEPLOY_RUNBOOK.md',
  'docs/V0_9_0_SMOKE_TEST_RESULTS_TEMPLATE.md',
];

const CANONICAL_PHASES = [
  'LEVEL_1_OPERATOR',
  'LEVEL_2_PRODUCT',
  'LEVEL_3_TERRITORY',
  'LEVEL_4_SALES',
  'LEVEL_5_EXPANSION',
  'SPECIALIZED_TRACKS',
  'LEVEL_7_DIRECTOR',
  'MARKET_MASTERY',
];

const errors = [];

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (error) {
    errors.push(`Missing or unreadable file: ${file}`);
    return '';
  }
}

function requireFile(file) {
  if (!fs.existsSync(file)) errors.push(`Required file does not exist: ${file}`);
}

function requireIncludes(file, content, expected, message) {
  if (!content.includes(expected)) errors.push(`${file}: ${message}`);
}

for (const doc of REQUIRED_DOCS) requireFile(doc);
requireFile('packages/database/seed_safety.js');
requireFile('packages/database/migrations/1900000009000_v090_production_readiness_gates.js');
requireFile('scripts/validate-v090-launch-safety.js');
requireFile('scripts/validate-touched-counts.js');

const resetDb = read('packages/database/reset_db.js');
requireIncludes('packages/database/reset_db.js', resetDb, 'assertNonDestructiveSeedAllowed', 'destructive reset does not use seed safety guard');
requireIncludes('packages/database/reset_db.js', resetDb, 'destructive: true', 'database reset is not marked destructive');

const testAccounts = read('packages/database/seed_test_training_accounts.js');
requireIncludes('packages/database/seed_test_training_accounts.js', testAccounts, 'TEST_ACCOUNT_CREDENTIAL', 'test account seed does not require TEST_ACCOUNT_CREDENTIAL');
if (testAccounts.includes("return '9999'") || testAccounts.includes('return "9999"')) {
  errors.push('packages/database/seed_test_training_accounts.js: embedded default test credential is still present');
}

const enrollmentHook = read('apps/web/src/hooks/useTrainingEnrollment.ts');
requireIncludes('apps/web/src/hooks/useTrainingEnrollment.ts', enrollmentHook, 'if (IS_PRODUCTION)', 'production Academy fallback guard is missing');
requireIncludes('apps/web/src/hooks/useTrainingEnrollment.ts', enrollmentHook, 'Local fallback is disabled', 'production fallback error is not explicit');

const trainingInterface = read('apps/api/src/modules/training/training.interface.ts');
const enumBlock = trainingInterface.match(/export enum TrainingPhase \{([\s\S]*?)\n\}/)?.[1] || '';
const enumKeys = [...enumBlock.matchAll(/^\s*([A-Z0-9_]+)\s*=/gm)].map((match) => match[1]);
if (JSON.stringify(enumKeys) !== JSON.stringify(CANONICAL_PHASES)) {
  errors.push(`apps/api/src/modules/training/training.interface.ts: TrainingPhase enum must contain only canonical phases; found ${enumKeys.join(', ')}`);
}
requireIncludes('apps/api/src/modules/training/training.interface.ts', trainingInterface, 'LEGACY_PHASE_MAP', 'legacy phase map is missing');

const trainingRoutes = read('apps/api/src/modules/training/training.routes.ts');
requireIncludes('apps/api/src/modules/training/training.routes.ts', trainingRoutes, '/reps/:id/practical-exercise', 'practical exercise route is missing');

const app = read('apps/web/src/App.tsx');
requireIncludes('apps/web/src/App.tsx', app, "!['/training', '/dashboard'].includes(path)", 'uncertified rep CRM gate logic is missing');
requireIncludes('apps/web/src/App.tsx', app, 'PageProtected user={user} path="/dashboard"', 'dashboard is not protected through PageProtected');

const migration = read('packages/database/migrations/1900000009000_v090_production_readiness_gates.js');
requireIncludes('packages/database/migrations/1900000009000_v090_production_readiness_gates.js', migration, "to_regclass('public.users')", 'migration does not guard users table existence');
requireIncludes('packages/database/migrations/1900000009000_v090_production_readiness_gates.js', migration, 'ADD COLUMN IF NOT EXISTS practical_exercise_completed', 'migration does not idempotently add practical exercise column');
requireIncludes('packages/database/migrations/1900000009000_v090_production_readiness_gates.js', migration, 'ADD COLUMN IF NOT EXISTS assigned_rep_id', 'migration does not idempotently add order rep scope column');
requireIncludes('packages/database/migrations/1900000009000_v090_production_readiness_gates.js', migration, "column_name = 'updated_at'", 'migration does not guard updated_at usage');

if (errors.length > 0) {
  console.error('v0.9.0 production-ready validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('v0.9.0 production-ready validation passed');
