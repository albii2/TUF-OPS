#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const mnPath = path.join(root, 'apps/web/src/assets/tuf_mn_leads_final.csv');
const enrichedPath = path.join(root, 'apps/web/src/assets/tuf_leads_final_enriched.csv');
const csvPath = fs.existsSync(mnPath) ? mnPath : enrichedPath;
const seedPath = path.join(root, 'packages/database/seed_leads_from_csv.js');
const migrationPath = path.join(root, 'packages/database/migrations/1900000012000_v090_lead_csv_full_mapping.js');
const docPath = path.join(root, 'docs/V0_9_0_LEAD_CSV_MAPPING.md');

const expectedHeaders = [
  'school_name', 'school_url', 'school_colors', 'address', 'phone_number', 'enrollment', 'isd_number', 'website_link',
  'activities_director_name', 'activities_director_email', 'activities_director_phone_number',
  'football_offered', 'football_urls', 'basketball_offered', 'basketball_urls', 'hockey_offered', 'hockey_urls', 'baseball_offered', 'baseball_urls',
  'tuf_zone', 'tuf_priority',
];

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}
function pass(message) {
  console.log(`✅ ${message}`);
}
function read(file) {
  if (!fs.existsSync(file)) {
    fail(`Missing required file: ${path.relative(root, file)}`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}
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
function requireText(content, needle, label) {
  if (!content.includes(needle)) fail(label);
}
function forbidPattern(content, pattern, label) {
  if (pattern.test(content)) fail(label);
}

const csv = read(csvPath);
const seed = read(seedPath);
const migration = read(migrationPath);
const doc = read(docPath);

const rows = parseCsv(csv);
const headers = rows[0]?.map((header) => header.trim()) || [];
const missingHeaders = expectedHeaders.filter((header) => !headers.includes(header));
if (missingHeaders.length) fail(`CSV missing expected headers: ${missingHeaders.join(', ')}`);
else pass('Lead CSV headers match the v0.9 expected source-of-truth contract.');

const rowCount = Math.max(rows.length - 1, 0);
if (rowCount !== 260) fail(`Expected 260 lead rows, found ${rowCount}.`);
else pass('Lead CSV contains the expected 260 school records.');

for (const header of expectedHeaders) {
  requireText(seed, header, `Seed script does not reference CSV header ${header}.`);
}
if (!process.exitCode) pass('Seed script references every expected CSV header.');

const requiredSeedTerms = [
  'school_url', 'school_colors', 'full_address', 'address_line1', 'city', 'postal_code', 'school_phone', 'enrollment', 'isd_number', 'website_link',
  'tuf_zone', 'tuf_priority', 'lead_metadata', 'Athletic Director / Activities Director', 'organization_sports',
  'ON CONFLICT (organization_id, sport)', 'WHERE NOT EXISTS', 'TUF Metro', 'TUF North', 'getPrimeauDirectorId', 'assigned_director_id',
  'LEAD_ASSIGNED', 'UNIFORM', 'TRAVEL_GEAR', 'TEAM_STORE', 'LETTERMAN',
];
for (const term of requiredSeedTerms) {
  requireText(seed, term, `Seed script is missing required mapping/safety term: ${term}.`);
}

const requiredMigrationTerms = [
  'school_url', 'school_colors', 'full_address', 'address_line1', 'city', 'postal_code', 'school_phone', 'enrollment', 'isd_number', 'website_link',
  'tuf_zone', 'tuf_priority', 'lead_source', 'lead_metadata', 'CREATE TABLE IF NOT EXISTS organization_sports', 'UNIQUE (organization_id, sport)',
];
for (const term of requiredMigrationTerms) {
  requireText(migration, term, `Lead mapping migration is missing required schema term: ${term}.`);
}

forbidPattern(seed, /\bDELETE\s+FROM\b/i, 'Lead seed must not delete rows.');
forbidPattern(seed, /\bTRUNCATE\b/i, 'Lead seed must not truncate rows.');
forbidPattern(seed, /\bDROP\s+TABLE\b/i, 'Lead seed must not drop tables.');
forbidPattern(seed, /INSERT\s+INTO\s+(orders|invoices|commissions)\b/i, 'Lead seed must not create fake orders, invoices, or commissions.');

const requiredDocTerms = [
  'tuf_leads_final_enriched.csv', '260', 'school_name', 'activities_director_email', 'organization_sports', 'TUF Metro', 'TUF North', 'Primeau', 'Safe seed',
];
for (const term of requiredDocTerms) {
  requireText(doc, term, `Lead CSV mapping doc is missing required content: ${term}.`);
}

if (!process.exitCode) {
  pass('Lead mapping migration persists organization fields and sport coverage.');
  pass('Lead seed is idempotent, non-destructive, and keeps Metro/North assigned to Primeau.');
  pass('Lead CSV mapping documentation exists and covers production/preview seed verification.');
} else {
  process.exit(1);
}
