#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
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
  if (process.exitCode) process.exit(1);
  process.exit(0);
}

const { headers, records } = csvObjects(launchCsvPath);
const missingHeaders = requiredAssignmentHeaders.filter((header) => !headers.includes(header));
if (missingHeaders.length) {
  warn(`Launch assignment CSV ${path.relative(root, launchCsvPath)} is present but missing assignment headers: ${missingHeaders.join(', ')}. Use apps/web/src/assets/tuf_mn_leads_final.csv or set TUF_LEADS_CSV to the corrected file before preview/production assignment seeding.`);
  if (process.exitCode) process.exit(1);
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
} else {
  process.exit(1);
}
