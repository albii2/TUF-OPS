const { assertNonDestructiveSeedAllowed, isProductionEnvironment } = require('../packages/database/seed_safety');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(isProductionEnvironment({ NODE_ENV: 'production' }), 'NODE_ENV production was not detected');
assert(isProductionEnvironment({ VERCEL_ENV: 'production' }), 'VERCEL_ENV production was not detected');
assert(isProductionEnvironment({ APP_ENV: 'prod' }), 'APP_ENV prod was not detected');
assert(!isProductionEnvironment({ NODE_ENV: 'development', VERCEL_ENV: 'preview', APP_ENV: 'staging' }), 'Non-production env was incorrectly detected as production');

let blocked = false;
try {
  assertNonDestructiveSeedAllowed({ destructive: true, label: 'validation' });
} catch (_error) {
  blocked = process.env.NODE_ENV === 'production';
}

process.env.NODE_ENV = 'production';
try {
  assertNonDestructiveSeedAllowed({ destructive: true, label: 'validation' });
} catch (_error) {
  blocked = true;
}
assert(blocked, 'Destructive production seed/reset was not blocked');

console.log('seed safety validation passed');
