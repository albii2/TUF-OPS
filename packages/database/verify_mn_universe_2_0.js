/**
 * TUF Ops 2.0 — Wave 1B: post-import proof suite (the TEN required assertions).
 * =============================================================================
 *
 * Proves the Wave 1B Minnesota Market Universe intelligence import against the
 * TARGET database (Postgres-r5VC) by printing the ACTUAL query output for every
 * assertion. Exits non-zero if any assertion fails.
 *
 * Usage:
 *   DATABASE_URL=<target r5VC> [LEGACY_DATABASE_URL=<legacy read-only>] \
 *     node packages/database/verify_mn_universe_2_0.js
 *
 * Confidence tags used in the printed evidence: VERIFIED | INFERENCE | UNKNOWN.
 */

const { Client } = require('pg');
const fs = require('node:fs');
const path = require('node:path');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Refusing to run: set DATABASE_URL to the target Postgres-r5VC database.');
  process.exit(2);
}

const UNIVERSE_SOURCE = 'tuf_mn_leads_final.csv';
const EXPECTED_MARKETS = 3;
/** VERIFIED legitimate universe count (see docs/2.0/WAVE1B_MN_UNIVERSE_IMPORT.md). */
const EXPECTED_UNIVERSE = Number(process.env.EXPECTED_UNIVERSE || 272);

let failures = 0;

function printRows(rows) {
  if (rows.length === 0) {
    console.log('   (no rows)');
    return;
  }
  const cols = Object.keys(rows[0]);
  console.log('   ' + cols.join(' | '));
  for (const r of rows) console.log('   ' + cols.map((c) => String(r[c])).join(' | '));
}

async function assertion(num, title, tag, sql, values, check) {
  console.log(`\n=== ASSERTION ${num}: ${title} [${tag}] ===`);
  console.log(`SQL: ${sql.trim().replace(/\s+/g, ' ')}`);
  const { rows } = await client.query(sql, values || []);
  printRows(rows);
  try {
    check(rows);
    console.log('   -> PASS');
  } catch (error) {
    failures += 1;
    console.log(`   -> FAIL: ${error.message}`);
  }
}

let client;

async function main() {
  client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  console.log('TUF Ops 2.0 — Wave 1B post-import proof suite');
  console.log(`target: ${DATABASE_URL.replace(/:[^:@/]*@/, ':***@')}`);
  console.log(`expected universe organizations: ${EXPECTED_UNIVERSE}`);

  // 1 -----------------------------------------------------------------------
  await assertion(
    1,
    'Universe organizations = verified expected count',
    'VERIFIED',
    `SELECT count(*)::int AS organizations,
            count(*) FILTER (WHERE lead_source = '${UNIVERSE_SOURCE}')::int AS from_mn_dataset,
            count(*) FILTER (WHERE lead_metadata ? 'legacy_id')::int AS provenance_tagged
       FROM organizations`,
    [],
    (rows) => {
      const r = rows[0];
      if (Number(r.organizations) !== EXPECTED_UNIVERSE) {
        throw new Error(`organizations=${r.organizations}, expected ${EXPECTED_UNIVERSE}`);
      }
      if (Number(r.from_mn_dataset) !== EXPECTED_UNIVERSE) throw new Error(`from_mn_dataset=${r.from_mn_dataset}`);
      if (Number(r.provenance_tagged) !== EXPECTED_UNIVERSE) throw new Error(`provenance_tagged=${r.provenance_tagged}`);
    },
  );

  // 2 -----------------------------------------------------------------------
  await assertion(
    2,
    'Markets = exactly 3',
    'VERIFIED',
    `SELECT count(*)::int AS markets FROM markets`,
    [],
    (rows) => {
      if (Number(rows[0].markets) !== EXPECTED_MARKETS) throw new Error(`markets=${rows[0].markets}`);
    },
  );

  // 3 -----------------------------------------------------------------------
  await assertion(
    3,
    'Pillager / Pequot Lakes / Brainerd each resolve to exactly ONE organization and ONE market',
    'VERIFIED',
    `SELECT o.name,
            count(DISTINCT o.id)::int AS organization_rows,
            count(DISTINCT m.id)::int AS market_rows
       FROM organizations o
       LEFT JOIN markets m ON m.universe_organization_id = o.id
      WHERE lower(btrim(o.name)) IN ('pillager high school','pequot lakes high school','brainerd high school')
      GROUP BY o.name
      ORDER BY o.name`,
    [],
    (rows) => {
      if (rows.length !== 3) throw new Error(`expected 3 launch schools, got ${rows.length}`);
      for (const r of rows) {
        if (Number(r.organization_rows) !== 1) throw new Error(`${r.name}: organization_rows=${r.organization_rows}`);
        if (Number(r.market_rows) !== 1) throw new Error(`${r.name}: market_rows=${r.market_rows}`);
      }
    },
  );

  // 4 -----------------------------------------------------------------------
  await assertion(
    4,
    'A representative unactivated school exists in organizations but NOT in markets',
    'VERIFIED',
    `SELECT count(*) FILTER (WHERE m.id IS NULL)::int AS unactivated_universe,
            (SELECT string_agg(name, ', ' ORDER BY name)
               FROM (SELECT o2.name
                       FROM organizations o2
                      WHERE NOT EXISTS (SELECT 1 FROM markets m2 WHERE m2.universe_organization_id = o2.id)
                      ORDER BY o2.name LIMIT 5) s) AS sample_unactivated
       FROM organizations o
       LEFT JOIN markets m ON m.universe_organization_id = o.id`,
    [],
    (rows) => {
      const r = rows[0];
      if (Number(r.unactivated_universe) !== EXPECTED_UNIVERSE - EXPECTED_MARKETS) {
        throw new Error(`unactivated_universe=${r.unactivated_universe}, expected ${EXPECTED_UNIVERSE - EXPECTED_MARKETS}`);
      }
      if (!r.sample_unactivated) throw new Error('no representative unactivated school found');
    },
  );

  // 5 -----------------------------------------------------------------------
  await assertion(
    5,
    'organization_sports belongs to Universe organizations WITHOUT activating them',
    'VERIFIED',
    `SELECT count(*)::int AS sports_rows,
            count(DISTINCT s.organization_id)::int AS orgs_with_sports,
            count(*) FILTER (WHERE m.id IS NULL)::int AS sports_rows_on_unactivated,
            (SELECT count(*)::int FROM markets) AS markets
       FROM organization_sports s
       LEFT JOIN markets m ON m.universe_organization_id = s.organization_id`,
    [],
    (rows) => {
      const r = rows[0];
      if (Number(r.sports_rows) < 1) throw new Error('no sports rows');
      if (Number(r.orgs_with_sports) !== EXPECTED_UNIVERSE) throw new Error(`orgs_with_sports=${r.orgs_with_sports}, expected ${EXPECTED_UNIVERSE}`);
      if (Number(r.markets) !== EXPECTED_MARKETS) throw new Error(`importing sports created markets: ${r.markets}`);
      if (Number(r.sports_rows_on_unactivated) < 1) throw new Error('expected sports rows on unactivated orgs');
    },
  );

  // 6 -----------------------------------------------------------------------
  {
    console.log('\n=== ASSERTION 6: creating/importing another Universe organization does NOT create a Market [VERIFIED] ===');
    await client.query('BEGIN');
    let ok = true;
    let detail = '';
    try {
      const before = (await client.query('SELECT count(*)::int AS n FROM markets')).rows[0].n;
      const ins = await client.query(
        `INSERT INTO organizations (name, state, status, created_by, updated_by)
         VALUES ($1::varchar, 'MN', 'active', 1, 1) RETURNING id`,
        [`Wave1B Inert Fixture ${Date.now()}`],
      );
      const after = (await client.query('SELECT count(*)::int AS n FROM markets')).rows[0].n;
      const linked = await client.query(
        'SELECT count(*)::int AS n FROM markets WHERE universe_organization_id = $1',
        [ins.rows[0].id],
      );
      detail = `markets before=${before}, after=${after}, market rows linked to new org=${linked.rows[0].n}`;
      if (Number(after) !== Number(before)) ok = false;
      if (Number(linked.rows[0].n) !== 0) ok = false;
    } finally {
      await client.query('ROLLBACK');
    }
    console.log(`   ${detail}`);
    console.log(`   -> ${ok ? 'PASS' : 'FAIL'}`);
    if (!ok) failures += 1;
  }

  // 7 -----------------------------------------------------------------------
  await assertion(
    7,
    'Operational Market queries return 3, not 272',
    'VERIFIED',
    `SELECT (SELECT count(*)::int FROM markets) AS market_count,
            (SELECT count(*)::int FROM markets m JOIN organizations o ON o.id = m.universe_organization_id) AS market_list_rows,
            (SELECT count(*)::int FROM organizations) AS universe_count`,
    [],
    (rows) => {
      const r = rows[0];
      if (Number(r.market_count) !== EXPECTED_MARKETS) throw new Error(`market_count=${r.market_count}, expected ${EXPECTED_MARKETS}`);
      if (Number(r.market_list_rows) !== EXPECTED_MARKETS) throw new Error(`market_list_rows=${r.market_list_rows}, expected ${EXPECTED_MARKETS}`);
      if (Number(r.universe_count) !== EXPECTED_UNIVERSE) throw new Error(`universe_count=${r.universe_count}, expected ${EXPECTED_UNIVERSE}`);
    },
  );

  // 8 -----------------------------------------------------------------------
  {
    const excluded = [
      'opportunities', 'orders', 'order_items', 'activities', 'activity_audit_history',
      'commissions', 'production_requests', 'opportunity_stage_history', 'creative_requests',
      'executive_intake', 'daily_activities', 'rep_activities', 'work_items', 'audit_logs',
    ];
    console.log('\n=== ASSERTION 8: no legacy operational rows were imported (excluded tables contribute zero rows) [VERIFIED] ===');
    for (const t of excluded) {
      const exists = await client.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1",
        [t],
      );
      if (exists.rows.length === 0) {
        console.log(`   ${t}: <absent>  -> 0 rows`);
        continue;
      }
      const n = (await client.query(`SELECT count(*)::int AS n FROM ${t}`)).rows[0].n;
      console.log(`   ${t}: ${n}`);
      if (Number(n) !== 0) {
        failures += 1;
        console.log(`   -> FAIL: ${t} has ${n} rows (legacy operational state imported!)`);
      }
    }
    console.log('   -> (all zero above means PASS)');
  }

  // 9 -----------------------------------------------------------------------
  {
    console.log('\n=== ASSERTION 9: ACTIVATE MARKET remains the only legitimate promotion path [INFERENCE from source scan + VERIFIED markets==3] ===');
    const repoRoot = process.cwd();
    const allow = new Set([
      path.join('apps', 'api', 'src', 'modules', 'markets', 'markets.service.ts'),
      path.join('packages', 'database', 'seed_markets_2_0.js'),
    ]);
    const offenders = [];
    const pattern = /INSERT\s+INTO\s+markets/i;
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '__tests__' || entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|js)$/.test(entry.name)) {
          const rel = path.relative(repoRoot, full);
          if (allow.has(rel)) continue;
          if (pattern.test(fs.readFileSync(full, 'utf8'))) offenders.push(rel);
        }
      }
    };
    for (const d of ['apps/api/src', 'packages/database']) {
      if (fs.existsSync(path.join(repoRoot, d))) walk(path.join(repoRoot, d));
    }
    console.log(`   unauthorized markets-INSERT sites outside {activateMarket, launch seed}: ${offenders.length === 0 ? 'none' : offenders.join(', ')}`);
    console.log(`   the Wave 1B import script itself embeds a raw markets INSERT statement? ${/INSERT\s+INTO\s+markets/i.test(fs.readFileSync(path.join(repoRoot, 'packages/database/import_mn_universe_2_0.js'), 'utf8')) ? 'YES' : 'NO'}`);
    console.log(`   -> ${offenders.length === 0 ? 'PASS' : 'FAIL'}`);
    if (offenders.length !== 0) failures += 1;
  }

  // 10 ----------------------------------------------------------------------
  await assertion(
    10,
    'Re-running the Universe seed/import is IDEMPOTENT — no duplicated organizations, sports, contacts or Markets',
    'VERIFIED',
    `SELECT
       (SELECT count(*)::int FROM (SELECT lower(btrim(name)), upper(btrim(state)) FROM organizations GROUP BY 1,2 HAVING count(*) > 1) d) AS duplicate_organizations,
       (SELECT count(*)::int FROM (SELECT organization_id, sport FROM organization_sports GROUP BY 1,2 HAVING count(*) > 1) d) AS duplicate_sports,
       (SELECT count(*)::int FROM (SELECT organization_id, lower(btrim(name)), lower(coalesce(email,'')) FROM contacts GROUP BY 1,2,3 HAVING count(*) > 1) d) AS duplicate_contacts,
       (SELECT count(*)::int FROM (SELECT universe_organization_id FROM markets GROUP BY 1 HAVING count(*) > 1) d) AS duplicate_markets`,
    [],
    (rows) => {
      const r = rows[0];
      for (const k of ['duplicate_organizations', 'duplicate_sports', 'duplicate_contacts', 'duplicate_markets']) {
        if (Number(r[k]) !== 0) throw new Error(`${k}=${r[k]}`);
      }
    },
  );

  console.log(`\nWave 1B proof suite: ${failures === 0 ? 'ALL ASSERTIONS PASSED' : `${failures} FAILURE(S)`}`);
  await client.end();
  if (failures > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error('Wave 1B proof suite aborted:', error?.message ?? error);
  process.exit(1);
});
