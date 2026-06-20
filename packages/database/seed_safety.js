const PRODUCTION_VALUES = new Set(['production', 'prod']);

function isProductionEnvironment(env = process.env) {
  return [env.NODE_ENV, env.VERCEL_ENV, env.APP_ENV, env.RAILWAY_ENVIRONMENT, env.RAILWAY_ENVIRONMENT_NAME]
    .filter(Boolean)
    .some((value) => PRODUCTION_VALUES.has(String(value).trim().toLowerCase()));
}

function assertNonDestructiveSeedAllowed({ destructive = false, label = 'seed' } = {}) {
  if (destructive && isProductionEnvironment()) {
    throw new Error(`Refusing to run destructive ${label} in production (NODE_ENV/VERCEL_ENV/APP_ENV production detected).`);
  }
}

module.exports = { isProductionEnvironment, assertNonDestructiveSeedAllowed };
