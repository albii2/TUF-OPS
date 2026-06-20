#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'apps/api/src/index.ts');
const trainingRoutesPath = path.join(root, 'apps/api/src/modules/training/training.routes.ts');
const index = fs.readFileSync(indexPath, 'utf8');
const trainingRoutes = fs.readFileSync(trainingRoutesPath, 'utf8');

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}
function pass(message) {
  console.log(`✅ ${message}`);
}
function normalizePath(value) {
  return value.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

const prefixMatches = [...index.matchAll(/server\.register\(trainingRoutes,\s*\{\s*prefix:\s*['"]([^'"]+)['"]\s*\}\s*\)/g)];
const prefixes = prefixMatches.map((match) => normalizePath(match[1]));
const canonicalPrefix = '/api/v1/training';

if (prefixes.length !== 1 || prefixes[0] !== canonicalPrefix) {
  fail(`trainingRoutes must be registered exactly once at ${canonicalPrefix}; found ${prefixes.length ? prefixes.join(', ') : 'none'}.`);
}

const routeMatches = [...trainingRoutes.matchAll(/server\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]/g)];
const finalRoutes = [];
const seen = new Set();
const duplicates = [];
for (const prefix of prefixes) {
  for (const [, method, routePath] of routeMatches) {
    const finalPath = normalizePath(`${prefix}/${routePath.replace(/^\//, '')}`);
    const key = `${method.toUpperCase()} ${finalPath}`;
    finalRoutes.push(key);
    if (seen.has(key)) duplicates.push(key);
    seen.add(key);
  }
}

for (const required of [
  'GET /api/v1/training/modules',
  'GET /api/v1/training/enrollment',
  'POST /api/v1/training/enrollment/start',
  'POST /api/v1/training/assessments/submit',
  'POST /api/v1/training/reps/:id/practical-exercise',
  'GET /api/v1/training/reps/:id/certification-status',
]) {
  if (!seen.has(required)) fail(`Missing required training route: ${required}`);
}

if (duplicates.length) fail(`Duplicate final training routes found: ${duplicates.join(', ')}`);
if (!process.exitCode) {
  pass('Training route registration is canonical and duplicate-free.');
  console.log(finalRoutes.sort().join('\n'));
}
process.exit(process.exitCode || 0);
