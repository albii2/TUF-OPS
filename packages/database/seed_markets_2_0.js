/**
 * TUF Ops 2.0 — Wave 1 launch seed (Commander-gated).
 * =============================================================================
 *
 * Governed by ACTIVATE_MARKET_SPEC §6: the seeded three launch markets are
 * inserted DIRECTLY at their real lifecycle stages by this Commander-gated seed
 * path — the interactive `activateMarket(...)` operation always produces
 * IDENTIFIED and is never used here.
 *
 * Produces EXACTLY three markets:
 *   MARKET 001  PILLAGER            PENETRATION    (LETTERED live / commerce)
 *   MARKET 002  PEQUOT LAKES        LAUNCH_READY   (collection / store launch prep)
 *   MARKET 003  BRAINERD            DEVELOPMENT    (front of funnel)
 *
 * The Minnesota dataset is Market Intelligence Universe ONLY. Importing a
 * school creates an inert `organizations` row and nothing else. This seed never
 * bulk-activates the universe: it touches exactly the three launch schools and
 * asserts that `markets` holds exactly three rows.
 *
 * Non-destructive and idempotent: inserts with ON CONFLICT DO NOTHING, never
 * deletes or overwrites. Safe to re-run.
 *
 * Usage:
 *   DATABASE_URL=<target> node packages/database/seed_markets_2_0.js
 * Target for Wave 1 is the NEW Postgres-r5VC database ONLY.
 */

const { Client } = require('pg');
const { assertNonDestructiveSeedAllowed } = require('./seed_safety.js');

const SEED_SOURCE = 'SEED_LAUNCH_2_0';

// Each market is deliberately at a DIFFERENT stage (plan T6.1, R3).
const LAUNCH_MARKETS = [
  {
    marketNumber: 1,
    label: 'PILLAGER',
    schoolName: 'Pillager High School',
    state: 'PENETRATION', // LETTERED LIVE — post-launch / commerce side
    priority: 'TIER_1',
    objective: "Convert Pillager's live LETTERED collection into repeat institutional and ISSUE revenue.",
    nextAction: 'Review Pillager LETTERED storefront metrics and queue the institutional re-entry touch.',
    nextActionDueDays: 3,
  },
  {
    marketNumber: 2,
    label: 'PEQUOT LAKES',
    schoolName: 'Pequot Lakes High School',
    state: 'LAUNCH_READY', // collection / store / launch preparation
    priority: 'TIER_2',
    objective: 'Take Pequot Lakes from collection concept to a launch-ready LETTERED store.',
    nextAction: 'Confirm the Pequot Lakes rights path and lock the collection concept.',
    nextActionDueDays: 7,
  },
  {
    marketNumber: 3,
    label: 'BRAINERD',
    schoolName: 'Brainerd High School',
    state: 'DEVELOPMENT', // front of funnel — qualification / development
    priority: 'TIER_3',
    objective: 'Qualify Brainerd as a TUF market and open the first TEAM UNIFORMS conversation.',
    nextAction: 'Schedule the Brainerd Athletic Director discovery call.',
    nextActionDueDays: 14,
  },
];

const MN = 'MN';

async function tableExists(client, tableName) {
  const result = await client.query(
    "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1",
    [tableName],
  );
  return result.rows.length > 0;
}

async function resolveOwnerId(client) {
  const override = process.env.TUF_MARKET_OWNER_ID;
  if (override) {
    const found = await client.query('SELECT id FROM users WHERE id = $1', [Number(override)]);
    if (found.rows.length === 0) throw new Error(`TUF_MARKET_OWNER_ID=${override} does not resolve to a users row`);
    return Number(override);
  }
  const result = await client.query(
    "SELECT id FROM users ORDER BY CASE WHEN role = 'ADMIN' THEN 0 ELSE 1 END, id LIMIT 1",
  );
  if (result.rows.length === 0) {
    throw new Error('No users row exists to own the launch markets; run migrations first.');
  }
  return result.rows[0].id;
}

/** Returns the universe organization id for a launch school, creating an INERT
 * row if the universe does not yet carry it (importing creates no Market). */
async function ensureUniverseOrganization(client, schoolName, ownerId) {
  const existing = await client.query(
    `SELECT id FROM organizations
      WHERE lower(btrim(name)) = lower(btrim($1::text))
        AND (upper(btrim(coalesce(state, ''))) = $2 OR coalesce(state, '') = '')
      ORDER BY id LIMIT 1`,
    [schoolName, MN],
  );
  if (existing.rows.length > 0) return { id: existing.rows[0].id, created: false };

  const inserted = await client.query(
    `INSERT INTO organizations (name, state, status, lead_source, created_by, updated_by)
     VALUES ($1::varchar, $2::varchar, 'active', $3::varchar, $4::integer, $4::integer)
     RETURNING id`,
    [schoolName, MN, 'tuf_2_0_launch_universe', ownerId],
  );
  return { id: inserted.rows[0].id, created: true };
}

async function main() {
  assertNonDestructiveSeedAllowed({ destructive: false, label: 'markets 2.0 launch seed' });

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required to seed the 2.0 launch markets');

  const client = new Client({ connectionString });
  await client.connect();

  try {
    if (!(await tableExists(client, 'markets'))) {
      throw new Error('markets table is missing; run migrations before seeding the 2.0 launch markets');
    }

    const ownerId = await resolveOwnerId(client);
    const seen = [];

    await client.query('BEGIN');
    for (const spec of LAUNCH_MARKETS) {
      const org = await ensureUniverseOrganization(client, spec.schoolName, ownerId);
      const dueAt = new Date(Date.now() + spec.nextActionDueDays * 24 * 60 * 60 * 1000).toISOString();

      const market = await client.query(
        `INSERT INTO markets (
           market_number, universe_organization_id, owner_id, priority, objective,
           next_action, next_action_due, state, activated_at, source, created_by, updated_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), $9, $10, $10)
         ON CONFLICT (universe_organization_id) DO NOTHING
         RETURNING *`,
        [
          spec.marketNumber,
          org.id,
          ownerId,
          spec.priority,
          spec.objective,
          spec.nextAction,
          dueAt,
          spec.state,
          SEED_SOURCE,
          ownerId,
        ],
      );

      if (market.rows.length > 0) {
        const row = market.rows[0];
        await client.query(
          `INSERT INTO market_tasks (market_id, title, due_at, state, source, created_by)
           VALUES ($1, $2, $3, 'OPEN', $4, $5)`,
          [row.id, spec.nextAction, dueAt, SEED_SOURCE, ownerId],
        );
        await client.query(
          `INSERT INTO market_activities (market_id, type, source, actor_id, detail)
           VALUES ($1, 'MARKET_ACTIVATED', $2, $3, $4)`,
          [row.id, SEED_SOURCE, ownerId, spec.objective],
        );
      }

      seen.push({ ...spec, organizationId: org.id, organizationCreated: org.created });
    }

    // Keep the sequence past the explicitly-seeded numbers (spec §5, Option A).
    await client.query(
      "SELECT setval('market_number_seq', GREATEST(3, (SELECT COALESCE(MAX(market_number), 0) FROM markets)), true)",
    );
    await client.query('COMMIT');

    // --- Evidence: assert the launch integrity contract (spec §9.7). ---
    const summary = await client.query(
      `SELECT m.market_number, o.name AS school, m.state, m.priority, m.next_action_due
         FROM markets m
         JOIN organizations o ON o.id = m.universe_organization_id
        ORDER BY m.market_number`,
    );
    const count = await client.query('SELECT count(*)::int AS n FROM markets');
    const marketCount = count.rows[0].n;

    console.log('TUF Ops 2.0 launch seed — applied to the target database.');
    console.log(`markets count = ${marketCount} (expected 3)`);
    for (const row of summary.rows) {
      console.log(
        `  ${String(row.market_number).padStart(3, '0')}  ${row.school}  [${row.state}]  ${row.priority}  due ${row.next_action_due.toISOString()}`,
      );
    }
    for (const row of seen) {
      console.log(
        `  universe: ${row.label} -> organization ${row.organizationId} (${row.organizationCreated ? 'created inert' : 'existing'})`,
      );
    }

    if (marketCount !== 3) {
      throw new Error(`Launch integrity FAILED: markets count is ${marketCount}, expected exactly 3`);
    }
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Launch seed FAILED:', error.message);
  process.exit(1);
});
