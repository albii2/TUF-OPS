const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const includes = (file, needle, message) => check(read(file).includes(needle), `${file}: ${message}`);
const apiIndex = read('apps/api/src/index.ts');
check(apiIndex.includes("server.register(trainingRoutes, { prefix: '/api/v1/training' })"), 'API must register training routes at /api/v1/training for production web default');
check(!apiIndex.includes("server.register(trainingRoutes, { prefix: '/training' })"), 'API must not duplicate training routes at legacy /training prefix');
check(!apiIndex.includes("server.register(trainingRoutes, { prefix: '/api/training' })"), 'API must not duplicate training routes at legacy /api/training prefix');

for (const file of [
  'apps/web/src/components/TrainingPortalPage.tsx',
  'apps/web/src/components/TrainingModuleDetail.tsx',
  'apps/web/src/hooks/useTrainingEnrollment.ts',
  'apps/api/src/modules/training/training.routes.ts',
  'apps/web/src/components/academy/LockerRoomSimulator.tsx',
  'apps/web/src/pages/LockerRoomSimulatorPage.tsx',
  'packages/database/migrations/1900000005000_seed_training_modules.js',
  'packages/database/migrations/1900000014000_v090_academy_content_refresh.js',
  'docs/V0_9_0_ACADEMY_LAUNCH_CHECKLIST.md',
]) check(exists(file), `${file} is missing`);

const enrollment = read('apps/web/src/hooks/useTrainingEnrollment.ts');
const migration = read('packages/database/migrations/1900000005000_seed_training_modules.js');
const simulator = read('apps/web/src/components/academy/LockerRoomSimulator.tsx');
const portal = read('apps/web/src/components/TrainingPortalPage.tsx');
const app = read('apps/web/src/App.tsx');

for (const title of [
  'Welcome to TUF Sports Apparel', 'How TUF Makes Money', 'Rep Expectations: 4 Orders Per Month',
  '72-Hour Certification Standard', 'How Certification Unlocks CRM Access', 'Uniforms: TUF SHIFT, TUF GRIND, TUF OVERTIME, TUF FLEX',
  'Player Packs and Travel Gear', 'Team Stores', 'Letterman Jackets', 'Price Confidence and Margin Basics',
  'Understanding Assigned Schools', 'How to Work Athletic Directors and Coaches', 'Feeder Programs and Youth Extraction',
  'Travel Teams and Club Opportunities', 'How to Log a School Touch Correctly', 'Discovery Call Framework',
  'First Contact Script', 'Handling “We Already Have a Vendor”', 'Getting to Mockup/Sample', 'Follow-Up Discipline',
  'Moving from Interest to Closed Won', 'Dashboard Basics', 'Organizations and Contacts', 'Opportunities and Stages',
  'Orders After Closed Won', 'Commission Basics and Payment-Gated Earnings', 'Football', 'Basketball', 'Baseball',
  'Volleyball', 'Women’s Sports', '7v7/Flag', 'Youth Programs', 'Letterman Jacket Campaigns'
]) {
  check(enrollment.includes(title), `frontend fallback missing Academy module: ${title}`);
  check(migration.includes(title.replace(/'/g, "''")) || migration.includes(title), `database content seed missing Academy module: ${title}`);
}

for (const phrase of ['## Training Explanation', '## Rep Actions', '## Field Language', '## What Done Means', '## Practical Checkpoint']) {
  check(enrollment.includes(phrase), `module content missing section ${phrase}`);
  check(migration.includes(phrase), `database seed content missing section ${phrase}`);
}

includes('apps/web/src/hooks/useTrainingEnrollment.ts', 'if (IS_PRODUCTION)', 'production fallback guard missing');
includes('apps/web/src/hooks/useTrainingEnrollment.ts', 'Local fallback is disabled', 'production fallback disabled message missing');
includes('apps/api/src/modules/training/training.routes.ts', '/reps/:id/practical-exercise', 'practical exercise route missing');
includes('apps/web/src/App.tsx', '/training/simulator', 'Locker Room Simulator route missing');
includes('apps/web/src/App.tsx', "path=\"/training\"", 'Academy route missing');
includes('apps/web/src/App.tsx', '!user.isCertified', 'CRM gate must reference certification state');
includes('apps/web/src/components/TrainingModuleDetail.tsx', 'content_markdown', 'module detail must render content markdown');
includes('apps/web/src/components/TrainingPortalPage.tsx', '72-hour', '72-hour certification copy missing');
includes('apps/web/src/components/TrainingPortalPage.tsx', 'Practical Exercise', 'certification checklist practical exercise copy missing');
includes('apps/web/src/components/TrainingPortalPage.tsx', 'CRM Unlock', 'certification checklist CRM unlock copy missing');
includes('apps/web/src/components/TrainingPortalPage.tsx', 'Locker Room Simulator', 'Academy simulator section missing');
includes('packages/database/migrations/1900000005000_seed_training_modules.js', 'WITH incoming', 'training content seed must be idempotent update/insert');
includes('packages/database/migrations/1900000014000_v090_academy_content_refresh.js', "require('./1900000005000_seed_training_modules')", 'Academy content refresh migration must reuse the idempotent content seed');
check(!migration.includes('DELETE FROM training_modules'), 'training seed migration must not delete Academy content');

for (const scenario of [
  'Athletic Director intro call', 'Football coach uniform pitch', '“We already have a vendor”', 'Budget objection',
  'Team store pitch', 'Player pack upsell', 'Letterman jacket campaign', 'Feeder/youth referral ask',
  'Follow-up after no response', 'Closing for mockup/sample'
]) check(simulator.includes(scenario), `simulator missing scenario: ${scenario}`);

check(simulator.includes('LOCKER_ROOM_SCENARIOS'), 'simulator scenario list missing');
check(portal.includes('/training/simulator'), 'Academy page does not link to simulator');

if (errors.length) {
  console.error('Academy launch validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('v0.9.0 Academy launch validation passed');
