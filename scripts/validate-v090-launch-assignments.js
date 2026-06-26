#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

const root = path.resolve(__dirname, '..');

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
const seedPath = path.join(root, 'packages/database/seed_leads_from_csv.js');
const assetsDir = path.join(root, 'apps/web/src/assets');
const defaultCsvPath = fs.existsSync(path.join(assetsDir, 'tuf_mn_leads_final.csv'))
  ? path.join(assetsDir, 'tuf_mn_leads_final.csv')
  : path.join(assetsDir, 'tuf_leads_final_enriched.csv');
const launchCsvPath = process.env.TUF_LEADS_CSV || defaultCsvPath;
const correctedFiles = [
  'tuf_mn_leads_final.csv',
  'tuf_leads_with_launch_assignments_david_cody_fixed.csv',
  'primeau_team_120_school_assignments_david_cody_fixed.csv',
  'primeau_director_pool_overflow_david_cody_fixed.csv',
  'david_cody_reassignment_audit.csv',
];
const expectedRepCounts = {
  'Jason Mulder': 30,
  'Josh Hoffman': 30,
  'Shayla Hilliard': 30,
  'David Lundberg': 30,
};
const requiredAssignmentHeaders = [
  'assigned_director_name',
  'assigned_rep_name',
  'assignment_batch',
  'assignment_rationale',
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}
function normalize(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}
function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}
function pass(message) {
  console.log(`✅ ${message}`);
}
function warn(message) {
  console.warn(`⚠️ ${message}`);
}
function read(file) {
  return fs.readFileSync(file, 'utf8');
}
function csvObjects(file) {
  const rows = parseCsv(read(file));
  const headers = rows[0].map((header) => normalize(header).toLowerCase());
  return {
    headers,
    records: rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, normalize(row[index])]))),
  };
}
function uniqueSchoolKey(record) {
  return `${normalize(record.school_name).toLowerCase()}|${normalize(record.state || 'mn').toLowerCase()}`;
}

// 1. Run static seed support validation
const seed = read(seedPath);
for (const term of [
  'assigned_director_name', 'assigned_director_email', 'assigned_rep_name', 'assigned_rep_email', 'assignment_batch', 'assignment_rationale',
  'loadAssignableUsers', 'matchUser', 'resolveLaunchAssignment', 'Primeau Director Pool', 'Future Zone Pool', 'shouldClearRep', 'shouldClearDirector',
]) {
  if (!seed.includes(term)) fail(`Seed script is missing assignment support term: ${term}`);
}
if (/INSERT\s+INTO\s+(orders|invoices|commissions|activities)\b/i.test(seed)) fail('Lead assignment seed must not create fake orders, invoices, commissions, or activities.');
if (/\bDELETE\s+FROM\b|\bTRUNCATE\b|\bDROP\s+TABLE\b/i.test(seed)) fail('Lead assignment seed must remain non-destructive.');
if (!process.exitCode) pass('Seed supports optional assignment columns and remains non-destructive.');

if (fs.existsSync(defaultCsvPath)) {
  const { records } = csvObjects(defaultCsvPath);
  const seen = new Set();
  for (const record of records) {
    const key = uniqueSchoolKey(record);
    if (seen.has(key)) fail(`Duplicate school in baseline CSV: ${record.school_name}`);
    seen.add(key);
  }
  if (!process.exitCode) pass('Baseline lead CSV has no duplicate school keys.');
}

const missingCorrectedFiles = correctedFiles.filter((name) => !fs.existsSync(path.join(root, 'apps/web/src/assets', name)) && !fs.existsSync(path.join(root, name)));
if (!fs.existsSync(launchCsvPath)) {
  warn(`Corrected launch assignment CSV not found at ${path.relative(root, launchCsvPath)}. Static seed support passed, but 30/30/30/30 assignment counts require the owner-provided file before preview/production seeding.`);
  if (missingCorrectedFiles.length) warn(`Missing corrected owner files: ${missingCorrectedFiles.join(', ')}`);
  checkDatabaseValidation();
  process.exit(0);
}

const { headers, records } = csvObjects(launchCsvPath);
const missingHeaders = requiredAssignmentHeaders.filter((header) => !headers.includes(header));
if (missingHeaders.length) {
  warn(`Launch assignment CSV ${path.relative(root, launchCsvPath)} is present but missing assignment headers: ${missingHeaders.join(', ')}. Use apps/web/src/assets/tuf_mn_leads_final.csv or set TUF_LEADS_CSV to the corrected file before preview/production assignment seeding.`);
  checkDatabaseValidation();
  process.exit(0);
}

const seen = new Set();
for (const record of records) {
  const key = uniqueSchoolKey(record);
  if (seen.has(key)) fail(`Duplicate school in launch assignment CSV: ${record.school_name}`);
  seen.add(key);
}

const counts = Object.fromEntries(Object.keys(expectedRepCounts).map((name) => [name, 0]));
let davidBadRationale = 0;
let primeauPoolCount = 0;
for (const record of records) {
  const rep = normalize(record.assigned_rep_name);
  const batch = normalize(record.assignment_batch).toLowerCase();
  const rationale = normalize(record.assignment_rationale).toLowerCase();
  if (Object.prototype.hasOwnProperty.call(counts, rep)) counts[rep] += 1;
  if (rep === 'David Lundberg' && (!/(remote|outstate|north\s*-?corridor|phone|email)/.test(rationale) || /(east metro|woodbury|st\.\s*paul|saint paul)/.test(rationale))) davidBadRationale += 1;
  if (batch.includes('primeau director pool') || batch.includes('director pool')) primeauPoolCount += 1;
}
for (const [rep, expected] of Object.entries(expectedRepCounts)) {
  if (counts[rep] !== expected) fail(`${rep} expected ${expected} assigned schools, found ${counts[rep]}.`);
}
if (davidBadRationale) fail(`David Lundberg has ${davidBadRationale} rows with East Metro or non-remote rationale.`);
if (primeauPoolCount <= 0) fail('Primeau Director Pool / overflow rows were not found.');

if (!process.exitCode) {
  pass(`Launch assignment counts validated: ${JSON.stringify(counts)}`);
  pass(`Primeau Director Pool / overflow rows found: ${primeauPoolCount}`);
  pass('David Lundberg assignment rationale is remote/outstate/north-corridor and not East Metro.');
}

checkDatabaseValidation();

async function checkDatabaseValidation() {
  const env = { ...readEnvFile(), ...process.env };
  const databaseUrl = env.DATABASE_URL || env.TEST_DATABASE_URL;
  if (!databaseUrl) {
    console.warn('⚠️ DATABASE_URL not set; skipping database launch assignments validation.');
    if (process.exitCode) process.exit(process.exitCode);
    return;
  }

  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    console.log('Connected to database for launch assignments validation...');

    // 1. Verify there are no fake role labels
    const rolesRes = await client.query('SELECT DISTINCT role FROM users');
    const validRoles = new Set(['ADMIN', 'REGIONAL_DIRECTOR', 'DIRECTOR', 'REP']);
    for (const row of rolesRes.rows) {
      if (!validRoles.has(row.role)) {
        fail(`Invalid/fake user role found in database: ${row.role}`);
      }
    }
    if (!process.exitCode) pass('No fake role labels found.');

    // 2. Brad is ADMIN/National
    const bradRes = await client.query(`
      SELECT count(*)::int AS count FROM users 
      WHERE role = 'ADMIN' 
        AND (lower(name) LIKE '%bradshaw%' OR lower(email) = 'owner@tuf.local')
        AND region = 'National'
    `);
    if (bradRes.rows[0].count < 1) {
      fail('Brad is not configured as ADMIN with National scope.');
    } else {
      pass('Brad is ADMIN/National.');
    }

    // 3. Primeau is DIRECTOR/MN/General/Metro + North
    const primeauRes = await client.query(`
      SELECT count(*)::int AS count FROM users 
      WHERE role = 'DIRECTOR' 
        AND (lower(name) LIKE '%primeau%' OR lower(email) = 'primeau.hill@tufsports.us')
        AND state_market = 'MN'
        AND division = 'General'
        AND subterritory = 'Metro + North'
    `);
    if (primeauRes.rows[0].count < 1) {
      fail('Primeau is not configured as DIRECTOR with MN/General/Metro + North scope.');
    } else {
      pass('Primeau is DIRECTOR/MN/General/Metro + North.');
    }

    // Get Primeau's user ID
    const pIdRes = await client.query("SELECT id FROM users WHERE lower(name) LIKE '%primeau%' OR lower(email) = 'primeau.hill@tufsports.us' LIMIT 1");
    const primeauId = pIdRes.rows[0]?.id;

    // 4. Jason, David, Josh, Shayla each have 30 schools
    const reps = ['Jason Mulder', 'David Lundberg', 'Josh Hoffman', 'Shayla Hilliard'];
    for (const repName of reps) {
      const repRes = await client.query(`
        SELECT u.id, count(o.id)::int AS count 
        FROM users u 
        LEFT JOIN organizations o ON o.assigned_rep_id = u.id 
        WHERE lower(u.name) = lower($1)
        GROUP BY u.id
      `, [repName]);
      const count = repRes.rows[0]?.count ?? 0;
      if (count !== 30) {
        fail(`Rep ${repName} has ${count} schools instead of 30.`);
      }
    }
    if (!process.exitCode) pass('Reps Jason, David, Josh, Shayla each have exactly 30 schools.');

    // 5. Primeau director pool has 45 schools
    if (primeauId) {
      const dirPoolRes = await client.query(`
        SELECT count(*)::int AS count FROM organizations 
        WHERE assigned_director_id = $1 AND assigned_rep_id IS NULL
      `, [primeauId]);
      const dirPoolCount = dirPoolRes.rows[0].count;
      if (dirPoolCount !== 45) {
        fail(`Primeau director pool has ${dirPoolCount} schools instead of 45.`);
      } else {
        pass('Primeau director pool has exactly 45 schools.');
      }
    }

    // 6. 95 future/rep-pool schools are zoned but not rep-assigned
    if (primeauId) {
      const repPoolRes = await client.query(`
        SELECT count(*)::int AS count FROM organizations 
        WHERE assigned_rep_id IS NULL AND (assigned_director_id IS NULL OR assigned_director_id != $1)
          AND name NOT LIKE 'Test Org%'
      `, [primeauId]);
      const repPoolCount = repPoolRes.rows[0].count;
      if (repPoolCount !== 95) {
        fail(`Future/rep-pool has ${repPoolCount} schools instead of 95.`);
      } else {
        pass('95 future/rep-pool schools are zoned but not rep-assigned.');
      }
    }

    // 7. 0 unassigned zones in the Minnesota launch
    const unassignedRes = await client.query(`
      SELECT count(*)::int AS count FROM organizations 
      WHERE (lower(tuf_zone) = 'unassigned' OR tuf_zone IS NULL)
        AND name NOT LIKE 'Test Org%'
    `);
    const unassignedCount = unassignedRes.rows[0].count;
    if (unassignedCount !== 0) {
      fail(`Found ${unassignedCount} unassigned zone records.`);
    } else {
      pass('0 unassigned zones in the Minnesota launch.');
    }

    if (!process.exitCode) {
      console.log('🎉 All launch assignment database checks passed!');
    }
  } catch (err) {
    fail(`Database validation error: ${err.message}`);
  } finally {
    await client.end();
  }

  if (process.exitCode) process.exit(1);
}
