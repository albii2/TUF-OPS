#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

const root = path.resolve(__dirname, '..');
const migrationPath = path.join(root, 'packages/database/migrations/1900000013000_v090_user_role_scope_columns.js');
const requiredColumns = ['rank', 'tier', 'region', 'state_market', 'division', 'territory', 'subterritory', 'sport_focus', 'reports_to_user_id'];
const expectedUsers = [
  { label: 'Brad / A Bradshaw VP', emails: ['abradshaw@tufsports.us', 'owner@tuf.local', 'coach@tuf.local'], names: ['a bradshaw vp', 'bradshaw vp'], role: 'ADMIN', rank: 'Admin', region: 'National', territory: 'National', division: 'All', subterritory: 'All', sport_focus: 'All' },
  { label: 'Primeau Hill', emails: ['primeau.hill@tufsports.us'], names: ['primeau hill'], role: 'DIRECTOR', rank: 'Director', region: 'Midwest', state_market: 'MN', territory: 'Minnesota', division: 'General', subterritory: 'Metro + North', sport_focus: 'All' },
  { label: 'Jason Mulder', emails: ['jvmulder@gmail.com'], names: ['jason mulder'], role: 'REP', rank: 'Senior TAE', tier: 'Senior TAE', region: 'Midwest', state_market: 'MN', territory: 'Minnesota', division: 'General', subterritory: 'South / Southwest Metro', sport_focus: 'All', reportsTo: 'primeau.hill@tufsports.us' },
  { label: 'David Lundberg', emails: ['lundbergdave18@gmail.com'], names: ['david lundberg'], role: 'REP', rank: 'Senior TAE', tier: 'Senior TAE', region: 'Midwest', state_market: 'MN', territory: 'Minnesota', division: 'General', subterritory: 'North / Outstate / Remote', sport_focus: 'All', reportsTo: 'primeau.hill@tufsports.us' },
  { label: 'Josh Hoffman', emails: ['jhoffman@kipsu.com'], names: ['josh hoffman'], role: 'REP', rank: 'TAE', tier: 'TAE', region: 'Midwest', state_market: 'MN', territory: 'Minnesota', division: 'General', subterritory: 'West Metro / Minneapolis Inner Ring', sport_focus: 'All', reportsTo: 'primeau.hill@tufsports.us' },
  { label: 'Shayla Hilliard', emails: ['shaylahilliard17@gmail.com'], names: ['shayla hilliard'], role: 'REP', rank: 'TAE', tier: 'TAE', region: 'Midwest', state_market: 'MN', territory: 'Minnesota', division: 'General', subterritory: 'Northwest / North Metro', sport_focus: 'All', reportsTo: 'primeau.hill@tufsports.us' },
];

function readEnvFile() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(fs.readFileSync(envPath, 'utf8').split(/\r?\n/).flatMap((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return [];
    const index = trimmed.indexOf('=');
    return [[trimmed.slice(0, index), trimmed.slice(index + 1).replace(/^['"]|['"]$/g, '')]];
  }));
}
function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}
function pass(message) {
  console.log(`✅ ${message}`);
}
function requireText(content, needle, label) {
  if (!content.includes(needle)) fail(label);
}
function sqlList(values) {
  return values.map((_, index) => `$${index + 1}`).join(', ');
}

const migration = fs.readFileSync(migrationPath, 'utf8');
for (const column of requiredColumns) requireText(migration, `ADD COLUMN IF NOT EXISTS ${column}`, `Migration must add users.${column}.`);
for (const expected of expectedUsers) {
  requireText(migration, expected.subterritory, `Migration missing launch scope for ${expected.label}.`);
}
requireText(migration, 'FOREIGN KEY (reports_to_user_id) REFERENCES users(id)', 'Migration must add reports_to_user_id self-reference.');
if (/DROP\s+COLUMN|DELETE\s+FROM|TRUNCATE/i.test(migration)) fail('Launch user display migration must be non-destructive.');
if (!process.exitCode) pass('Launch user display migration statically includes required columns and backfills.');

const env = { ...readEnvFile(), ...process.env };
const connectionString = env.DATABASE_URL;
if (!connectionString) {
  console.warn('⚠️ DATABASE_URL is not set; skipped live users table validation.');
  if (process.exitCode) process.exit(1);
  process.exit(0);
}

(async () => {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const columnResult = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = ANY($1::text[])`,
      [requiredColumns],
    );
    const foundColumns = new Set(columnResult.rows.map((row) => row.column_name));
    const missing = requiredColumns.filter((column) => !foundColumns.has(column));
    if (missing.length) fail(`Preview users table is missing columns: ${missing.join(', ')}`);
    else pass('Preview users table has all role/rank/scope columns.');

    const primeau = await client.query("SELECT id FROM users WHERE lower(email) = 'primeau.hill@tufsports.us' OR lower(name) = 'primeau hill' ORDER BY id LIMIT 1");
    const primeauId = primeau.rows[0]?.id || null;

    for (const expected of expectedUsers) {
      const params = [...expected.emails.map((email) => email.toLowerCase()), ...expected.names.map((name) => name.toLowerCase())];
      const emailPlaceholders = sqlList(expected.emails);
      const namePlaceholders = expected.names.map((_, index) => `$${expected.emails.length + index + 1}`).join(', ');
      const result = await client.query(
        `SELECT id, name, email, role, rank, tier, region, state_market, division, territory, subterritory, sport_focus, reports_to_user_id
         FROM users
         WHERE lower(email) IN (${emailPlaceholders}) OR lower(name) IN (${namePlaceholders})
         ORDER BY id LIMIT 1`,
        params,
      );
      const row = result.rows[0];
      if (!row) {
        fail(`Launch user missing from users table: ${expected.label}`);
        continue;
      }
      for (const field of ['role', 'rank', 'tier', 'region', 'state_market', 'division', 'territory', 'subterritory', 'sport_focus']) {
        if (expected[field] !== undefined && row[field] !== expected[field]) fail(`${expected.label} ${field} expected ${expected[field]}, found ${row[field]}`);
      }
      if (expected.reportsTo && primeauId && row.reports_to_user_id !== primeauId) fail(`${expected.label} reports_to_user_id should point to Primeau (${primeauId}), found ${row.reports_to_user_id}`);
    }
    if (!process.exitCode) pass('Launch users have expected role/rank/scope display metadata.');
  } finally {
    await client.end();
  }
  if (process.exitCode) process.exit(1);
})().catch((error) => {
  if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'].includes(error.code) || String(error.message || '').includes('ECONNREFUSED')) {
    console.warn(`⚠️ DATABASE_URL is configured but not reachable (${error.code || error.message}); skipped live users table validation.`);
    if (process.exitCode) process.exit(1);
    process.exit(0);
  }
  console.error(error);
  process.exit(1);
});
