const crypto = require('crypto');
const { Client } = require('pg');

const TEST_USERS = [
  { name: 'TUF Test Director', email: 'test.director@tufsports.us', role: 'DIRECTOR', territory: 'National', assignedDirectorEmail: null },
  { name: 'TUF Test Director West', email: 'test.director.west@tufsports.us', role: 'DIRECTOR', territory: 'West', assignedDirectorEmail: null },
  { name: 'TUF Test Rep', email: 'test.rep@tufsports.us', role: 'REP', territory: 'National', assignedDirectorEmail: 'test.director@tufsports.us' },
];

function isProductionRuntime() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT === 'production';
}

function getCredential() {
  if (process.env.TEST_ACCOUNT_CREDENTIAL) return process.env.TEST_ACCOUNT_CREDENTIAL;
  if (isProductionRuntime()) {
    throw new Error('TEST_ACCOUNT_CREDENTIAL is required when seeding test accounts in production-like environments');
  }
  return '9999';
}

function assertSafeToSeed() {
  if (isProductionRuntime() && process.env.ALLOW_TEST_ACCOUNT_SEED !== 'true') {
    throw new Error('Refusing to seed test accounts in production without ALLOW_TEST_ACCOUNT_SEED=true');
  }
}

function credentialHash(credential) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const key = crypto.scryptSync(credential, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${key.toString('base64url')}`;
}

async function upsertUser(client, user, credential) {
  const directorResult = user.assignedDirectorEmail
    ? await client.query('SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1', [user.assignedDirectorEmail])
    : { rows: [] };
  const assignedDirectorId = directorResult.rows[0]?.id ?? null;
  const hash = credentialHash(credential);

  await client.query(
    `INSERT INTO users (name, email, role, territory, assigned_director_id, credential_hash, must_change_credential, status, failed_credential_attempts, locked_until, created_at, updated_at)
     VALUES ($1, lower($2), $3, $4, $5, $6, false, 'ACTIVE', 0, NULL, NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET
       name = EXCLUDED.name,
       role = EXCLUDED.role,
       territory = EXCLUDED.territory,
       assigned_director_id = EXCLUDED.assigned_director_id,
       credential_hash = EXCLUDED.credential_hash,
       must_change_credential = false,
       status = 'ACTIVE',
       failed_credential_attempts = 0,
       locked_until = NULL,
       updated_at = NOW()`,
    [user.name, user.email, user.role, user.territory, assignedDirectorId, hash],
  );
}

async function main() {
  assertSafeToSeed();
  const connectionString = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL or TEST_DATABASE_URL is required');
  const credential = getCredential();
  const client = new Client({ connectionString });

  await client.connect();
  try {
    for (const user of TEST_USERS) {
      await upsertUser(client, user, credential);
    }
    console.log(`Seeded ${TEST_USERS.length} test training accounts.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Failed to seed test training accounts:', error);
  process.exit(1);
});
