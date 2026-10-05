/**
 * TUF Ops 2.0 — Wave 3A LETTERED seed (Commander-gated).
 * =============================================================================
 *
 * Produces EXACTLY ONE realistic LETTERED deployment, for MARKET 001 PILLAGER,
 * at state LIVE — Pillager is the post-launch / commerce market (markets seed:
 * "PENETRATION — LETTERED live / commerce side").
 *
 * It stores ONLY the R8 Drops references (drops_organization_id,
 * drops_collection_id, storefront_url) plus the common fields. It stores NO
 * products, orders, customers, payments, or line items — Drops OS is the system
 * of record for the consumer commerce behind them.
 *
 * Idempotent and non-destructive: it inserts only when no
 * source='SEED_LETTERED_2_0' deployment exists for that market, never deletes or
 * overwrites. Safe to re-run.
 *
 * Usage:
 *   DATABASE_URL=<target> node packages/database/seed_lettered_2_0.js
 * Target is the NEW Postgres-r5VC database ONLY.
 */

const { Client } = require('pg');
const { assertNonDestructiveSeedAllowed } = require('./seed_safety.js');

const SEED_SOURCE = 'SEED_LETTERED_2_0';

const PILLAGER = {
  marketNumber: 1,
  state: 'LIVE',
  priority: 'TIER_1',
  objective:
    "Run Pillager's live LETTERED storefront from launch to repeat institutional and ISSUE revenue.",
  nextAction:
    "Review the Pillager LETTERED storefront's first-order data and queue the institutional re-entry touch.",
  nextActionDueDays: 3,
  dropsOrganizationId: 'pillager-high-school',
  dropsCollectionId: 'pillager-lettered-2026',
  storefrontUrl: '/schools/pillager-high-school/pillager-lettered-2026',
};

async function tableExists(client, tableName) {
  const result = await client.query(
    "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1",
    [tableName],
  );
  return result.rows.length > 0;
}

async function main() {
  assertNonDestructiveSeedAllowed({ destructive: false, label: 'lettered 2.0 deployment seed' });

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required to seed the 2.0 LETTERED deployment');

  const client = new Client({ connectionString });
  await client.connect();

  try {
    if (!(await tableExists(client, 'lettered_deployments'))) {
      throw new Error('lettered_deployments table is missing; run migrations before seeding');
    }

    // The Market this deployment belongs to. A deployment is keyed to markets.id.
    const marketResult = await client.query(
      'SELECT id, market_number, owner_id FROM markets WHERE market_number = $1 LIMIT 1',
      [PILLAGER.marketNumber],
    );
    if (marketResult.rows.length === 0) {
      throw new Error(`market_number ${PILLAGER.marketNumber} (Pillager) does not exist; run the markets seed first`);
    }
    const market = marketResult.rows[0];

    const ownerOverride = process.env.TUF_LETTERED_OWNER_ID;
    let ownerId = Number(market.owner_id);
    if (ownerOverride) {
      const found = await client.query('SELECT id FROM users WHERE id = $1', [Number(ownerOverride)]);
      if (found.rows.length === 0) throw new Error(`TUF_LETTERED_OWNER_ID=${ownerOverride} does not resolve to a users row`);
      ownerId = Number(ownerOverride);
    }

    const dueAt = new Date(Date.now() + PILLAGER.nextActionDueDays * 24 * 60 * 60 * 1000).toISOString();

    await client.query('BEGIN');

    // Idempotency: only insert when this seed has not already produced a
    // deployment for the market. No UNIQUE constraint needed; re-runs no-op.
    const inserted = await client.query(
      `INSERT INTO lettered_deployments (
         market_id, state, objective, owner_id, priority,
         next_action, next_action_due, blocker,
         drops_organization_id, drops_collection_id, storefront_url,
         source, created_by, updated_by
       )
       SELECT $1, $2, $3, $4, $5, $6, $7, NULL, $8, $9, $10, $11::varchar(64), $12, $12
        WHERE NOT EXISTS (
          SELECT 1 FROM lettered_deployments WHERE market_id = $1 AND source = $11::varchar(64)
        )
       RETURNING id`,
      [
        market.id,
        PILLAGER.state,
        PILLAGER.objective,
        ownerId,
        PILLAGER.priority,
        PILLAGER.nextAction,
        dueAt,
        PILLAGER.dropsOrganizationId,
        PILLAGER.dropsCollectionId,
        PILLAGER.storefrontUrl,
        SEED_SOURCE,
        ownerId,
      ],
    );

    await client.query('COMMIT');

    const applied = inserted.rows.length > 0;

    // --- Evidence ---
    const deployments = await client.query(
      `SELECT ld.id, m.market_number, m.market_number AS mn, ld.state, ld.priority,
              ld.objective, ld.next_action, ld.next_action_due, ld.owner_id,
              ld.drops_organization_id, ld.drops_collection_id, ld.storefront_url
         FROM lettered_deployments ld
         JOIN markets m ON m.id = ld.market_id
        WHERE m.market_number = $1
        ORDER BY ld.id`,
      [PILLAGER.marketNumber],
    );
    const total = await client.query('SELECT count(*)::int AS n FROM lettered_deployments');

    console.log('TUF Ops 2.0 LETTERED seed — applied to the target database.');
    console.log(`  inserted this run: ${applied ? 'yes (new row)' : 'no (already present — idempotent no-op)'}`);
    console.log(`  lettered_deployments total = ${total.rows[0].n} (expected 1)`);
    for (const row of deployments.rows) {
      console.log(
        `  MARKET ${String(row.market_number).padStart(3, '0')}  [${row.state}]  ${row.priority}  owner ${row.owner_id}`,
      );
      console.log(`    objective: ${row.objective}`);
      console.log(`    next: ${row.next_action} (due ${new Date(row.next_action_due).toISOString()})`);
      console.log(`    drops: org=${row.drops_organization_id} collection=${row.drops_collection_id}`);
      console.log(`    storefront: ${row.storefront_url}`);
    }

    if (deployments.rows.length !== 1) {
      throw new Error(`Seed integrity FAILED: expected exactly 1 Pillager deployment, found ${deployments.rows.length}`);
    }
    if (deployments.rows[0].state !== 'LIVE') {
      throw new Error(`Seed integrity FAILED: Pillager deployment state is ${deployments.rows[0].state}, expected LIVE`);
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
  console.error('LETTERED seed FAILED:', error.message);
  process.exit(1);
});
