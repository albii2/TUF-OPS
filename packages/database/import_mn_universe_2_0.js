/**
 * TUF Ops 2.0 — Wave 1B: Minnesota Market Universe INTELLIGENCE import.
 * =============================================================================
 *
 * Founder rulings in force (binding):
 *   R5 CLEAN SEED      — do NOT copy the legacy operational database.
 *   R2 PRESERVE UNIVERSE — DO import the legitimate Minnesota school intelligence
 *                          into the clean 2.0 database as the Market UNIVERSE.
 * Both hold simultaneously: this script imports intelligence ONLY and never any
 * legacy operational state.
 *
 * GOVERNING PRINCIPLE (ADR-001 §5 / ACTIVATE_MARKET_SPEC):
 *   Knowing a school exists does not make it a Market. Importing a school
 *   creates an inert `organizations` row and nothing else. A Market exists iff
 *   an ACTIVATE MARKET row exists. This script NEVER writes to `markets`.
 *
 * WHAT IS IMPORTED (intelligence only), and from where:
 *   - organizations       : the legitimate Minnesota school universe.
 *   - organization_sports : the org x sport offering cross-product.
 *   - contacts            : genuinely-classified Athletic-Director contact
 *                           intelligence (NOT a blind copy of all 259 rows).
 *
 * WHAT IS DELIBERATELY NOT IMPORTED (hard exclusions):
 *   opportunities, orders, order_items, activities, activity_audit_history,
 *   commissions, production_requests, opportunity_stage_history,
 *   creative_requests, executive_intake, any legacy pipeline/assignment state,
 *   fabricated/mock activity, Academy state — and ANY record merely because a
 *   legacy FK exists. Legacy `organizations` assignment columns
 *   (assigned_rep_id / assigned_director_id / territory_id / assigned_rep_name /
 *   assignment_pool / assignment_batch / assignment_rationale) are legacy
 *   pipeline state and are NOT imported.
 *
 * SOURCE VERIFICATION (why the count is not blindly 288):
 *   The legacy `organizations` table holds 288 rows from exactly two provenance
 *   streams:
 *     * `tuf_mn_leads_final.csv`              = 272 rows — the canonical
 *        Minnesota leads dataset, and EXACTLY the set carrying
 *        `organization_sports` (272 = 259 + 13 load batches). VERIFIED LEGITIMATE.
 *     * `tuf_leads_final_enriched.csv`        = 16 rows — the column DEFAULT,
 *        i.e. the original 2026-04-24 app-bootstrap prototype rows plus ad-hoc
 *        test/manual inserts (Test High, West Test High School,
 *        Tuf West [DUPLICATE], Tuf West High, Verify Josh, Final Bradshaw,
 *        Final Josh, Certified Tweakas, Seabreeze High, and three real-school
 *        names added outside the dataset). EXCLUDED as prototype/test residue.
 *   => VERIFIED LEGITIMATE UNIVERSE = 272, not the historical 288.
 *
 * RECONCILIATION (no duplicate Pillager / Pequot Lakes / Brainerd):
 *   The 2.0 launch seed already created the three launch organizations and the
 *   three `markets` rows reference them via `universe_organization_id`. This
 *   import reconciles by the target's natural key
 *   `(lower(btrim(name)), upper(btrim(state)))` (the
 *   `organizations_name_state_unique` index), matching the legacy identity
 *   rather than inserting new rows. Existing rows are ENRICHED in place so the
 *   three Market FKs stay valid; all other universe rows are inserted.
 *
 * PROVENANCE:
 *   - organizations    : legacy `lead_source` preserved; `lead_metadata`
 *                        augmented with {wave, origin, dataset, legacy_id}.
 *   - organization_sports : legacy `source` preserved.
 *   - contacts         : `contacts.source` set to 'legacy_mn_universe_2_0_1b'
 *                        (migration 1900000061000).
 *
 * SAFETY:
 *   - The legacy session is forced READ ONLY before any read. This script
 *     issues SELECTs against the legacy database and writes ONLY to the target.
 *   - Idempotent: safe to re-run; inserts/upserts never duplicate rows.
 *
 * Usage:
 *   LEGACY_DATABASE_URL=<legacy read-only> \
 *   DATABASE_URL=<target r5VC> \
 *     node packages/database/import_mn_universe_2_0.js
 *
 * Run ONCE per target database; re-running is a verified no-op on counts.
 */

const { Client } = require('pg');
const { assertNonDestructiveSeedAllowed } = require('./seed_safety.js');

/** The canonical Minnesota dataset file name — the universe provenance stream. */
const UNIVERSE_SOURCE = 'tuf_mn_leads_final.csv';

/** `contacts.source` marker written for every imported contact. */
const CONTACT_SOURCE = 'legacy_mn_universe_2_0_1b';

const WAVE = '1B';
const ORIGIN = 'legacy_postgres';

/**
 * A contact is excluded when its `name` is not a clean person name but carries
 * web-scrape / role residue. This is the deterministic classification rule for
 * records that are NOT genuine business-contact intelligence.
 */
const CONTACT_NAME_RESIDUE =
  /(xxx-xxx-xxxx|email me|administrative assistant|activities director|athletic director|principal)/i;

const UUID_LIKE = /[0-9a-f]{8}-[0-9a-f]{4}/i;

async function tableExists(client, table) {
  const r = await client.query(
    "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1",
    [table],
  );
  return r.rows.length > 0;
}

async function columnExists(client, table, column) {
  const r = await client.query(
    "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2",
    [table, column],
  );
  return r.rows.length > 0;
}

async function resolveActorId(target) {
  const r = await target.query(
    "SELECT id FROM users ORDER BY CASE WHEN role='ADMIN' THEN 0 ELSE 1 END, id LIMIT 1",
  );
  if (r.rows.length === 0) throw new Error('No users row exists in the target; run migrations first.');
  return r.rows[0].id;
}

/** Read the legitimate universe organizations from the (read-only) legacy DB. */
async function readLegacyOrganizations(legacy) {
  const { rows } = await legacy.query(
    `SELECT id, name, state, status, city, address_line1, postal_code, tuf_zone,
            school_url, school_colors, full_address, school_phone, enrollment,
            isd_number, website_link, tuf_priority, lead_source, lead_metadata,
            region, state_market, division, territory, subterritory, sport_focus,
            created_at, updated_at
       FROM organizations
      WHERE lead_source = $1
      ORDER BY id`,
    [UNIVERSE_SOURCE],
  );
  return rows;
}

async function readLegacySports(legacy) {
  const { rows } = await legacy.query(
    `SELECT s.id, s.organization_id, s.sport, s.offered, s.url, s.source,
            s.created_at, s.updated_at
       FROM organization_sports s
       JOIN organizations o ON o.id = s.organization_id
      WHERE o.lead_source = $1
      ORDER BY s.id`,
    [UNIVERSE_SOURCE],
  );
  return rows;
}

async function readLegacyContacts(legacy) {
  const { rows } = await legacy.query(
    `SELECT c.id, c.organization_id, c.name, c.email, c.phone, c.role,
            c.created_at, c.updated_at
       FROM contacts c
       JOIN organizations o ON o.id = c.organization_id
      WHERE o.lead_source = $1
      ORDER BY c.id`,
    [UNIVERSE_SOURCE],
  );
  return rows;
}

function isLegitContact(row) {
  if (!row.name || !String(row.name).trim()) return false;
  if (CONTACT_NAME_RESIDUE.test(row.name)) return false;
  return true;
}

/** Upsert one universe organization; returns the target row id. */
async function upsertOrganization(target, org, actorId) {
  const metadata = {
    wave: WAVE,
    origin: ORIGIN,
    dataset: UNIVERSE_SOURCE,
    legacy_id: org.id,
  };

  const existing = await target.query(
    `SELECT id FROM organizations
      WHERE lower(btrim(name)) = lower(btrim($1::text))
        AND upper(btrim(state)) = upper(btrim($2::text))
      ORDER BY id LIMIT 1`,
    [org.name, org.state],
  );

  const values = [
    org.name,
    org.state,
    org.status,
    org.city,
    org.address_line1,
    org.postal_code,
    org.tuf_zone,
    org.school_url,
    org.school_colors,
    org.full_address,
    org.school_phone,
    org.enrollment,
    org.isd_number,
    org.website_link,
    org.tuf_priority,
    org.lead_source || UNIVERSE_SOURCE,
    JSON.stringify(metadata),
    org.region,
    org.state_market,
    org.division,
    org.territory,
    org.subterritory,
    org.sport_focus,
    actorId,
  ];

  if (existing.rows[0]) {
    await target.query(
      `UPDATE organizations SET
         name = $1::varchar,
         state = $2::varchar,
         status = $3::varchar,
         city = $4::varchar,
         address_line1 = $5::text,
         postal_code = $6::varchar,
         tuf_zone = $7::varchar,
         school_url = $8::text,
         school_colors = $9::text,
         full_address = $10::text,
         school_phone = $11::varchar,
         enrollment = $12::integer,
         isd_number = $13::varchar,
         website_link = $14::text,
         tuf_priority = $15::varchar,
         lead_source = $16::varchar,
         lead_metadata = COALESCE(lead_metadata, '{}'::jsonb) || $17::jsonb,
         region = $18::varchar,
         state_market = $19::varchar,
         division = $20::varchar,
         territory = $21::varchar,
         subterritory = $22::varchar,
         sport_focus = $23::varchar,
         updated_by = $24::integer,
         updated_at = current_timestamp
       WHERE id = $25::integer`,
      [...values, existing.rows[0].id],
    );
    return { id: existing.rows[0].id, created: false };
  }

  const inserted = await target.query(
    `INSERT INTO organizations (
       name, state, status, city, address_line1, postal_code, tuf_zone,
       school_url, school_colors, full_address, school_phone, enrollment,
       isd_number, website_link, tuf_priority, lead_source, lead_metadata,
       region, state_market, division, territory, subterritory, sport_focus,
       created_by, updated_by, created_at, updated_at
     ) VALUES (
       $1::varchar, $2::varchar, $3::varchar, $4::varchar, $5::text, $6::varchar, $7::varchar,
       $8::text, $9::text, $10::text, $11::varchar, $12::integer,
       $13::varchar, $14::text, $15::varchar, $16::varchar, $17::jsonb,
       $18::varchar, $19::varchar, $20::varchar, $21::varchar, $22::varchar, $23::varchar,
       $24::integer, $24::integer, now(), now()
     ) RETURNING id`,
    values,
  );
  return { id: inserted.rows[0].id, created: true };
}

async function main() {
  assertNonDestructiveSeedAllowed({ destructive: false, label: 'MN Market Universe intelligence import (Wave 1B)' });

  const legacyUrl = process.env.LEGACY_DATABASE_URL;
  const targetUrl = process.env.DATABASE_URL;
  if (!legacyUrl) throw new Error('LEGACY_DATABASE_URL (read-only legacy Postgres) is required');
  if (!targetUrl) throw new Error('DATABASE_URL (target Postgres-r5VC) is required');

  const legacy = new Client({ connectionString: legacyUrl });
  const target = new Client({ connectionString: targetUrl });
  await legacy.connect();
  await target.connect();

  try {
    // Hard guard: the legacy session can only read. Any accidental write raises.
    await legacy.query('SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY');

    for (const t of ['organizations', 'organization_sports', 'contacts', 'markets']) {
      if (!(await tableExists(target, t))) throw new Error(`target is missing table "${t}"; run migrations first`);
    }
    if (!(await columnExists(target, 'contacts', 'source'))) {
      throw new Error('target contacts.source is missing; apply migration 1900000061000 first');
    }

    const actorId = await resolveActorId(target);

    // --- read intelligence from the read-only legacy source -----------------
    const orgs = await readLegacyOrganizations(legacy);
    const sports = await readLegacySports(legacy);
    const contacts = await readLegacyContacts(legacy);

    const legitContacts = contacts.filter(isLegitContact);
    const excludedContacts = contacts.filter((c) => !isLegitContact(c));

    const marketsBefore = (await target.query('SELECT count(*)::int AS n FROM markets')).rows[0].n;

    await target.query('BEGIN');

    // --- organizations ----------------------------------------------------
    const idMap = new Map();
    let orgsCreated = 0;
    let orgsReconciled = 0;
    for (const org of orgs) {
      const result = await upsertOrganization(target, org, actorId);
      idMap.set(org.id, result.id);
      if (result.created) orgsCreated += 1;
      else orgsReconciled += 1;
    }

    // --- organization_sports (belongs to the universe; activates nothing) ---
    let sportsInserted = 0;
    let sportsSkipped = 0;
    for (const s of sports) {
      const targetOrgId = idMap.get(s.organization_id);
      if (!targetOrgId) continue; // sports row for an excluded org — cannot happen for the dataset filter
      const res = await target.query(
        `INSERT INTO organization_sports
           (organization_id, sport, offered, url, source, created_at, updated_at)
         VALUES ($1::integer, $2::varchar, $3::boolean, $4::text, $5::varchar, $6::timestamp, $7::timestamp)
         ON CONFLICT (organization_id, sport) DO NOTHING`,
        [targetOrgId, s.sport, s.offered, s.url, s.source || UNIVERSE_SOURCE, s.created_at, s.updated_at],
      );
      if (res.rowCount === 1) sportsInserted += 1;
      else sportsSkipped += 1;
    }

    // --- contacts (classified intelligence only) ---------------------------
    let contactsInserted = 0;
    let contactsSkipped = 0;
    for (const c of legitContacts) {
      const targetOrgId = idMap.get(c.organization_id);
      if (!targetOrgId) continue;
      const res = await target.query(
        `INSERT INTO contacts
           (organization_id, name, email, phone, role, source, created_at, updated_at)
         SELECT $1::integer, $2::varchar, $3::varchar, $4::varchar, $5::varchar, $6::varchar, $7::timestamp, $8::timestamp
          WHERE NOT EXISTS (
            SELECT 1 FROM contacts
             WHERE organization_id = $1::integer
               AND lower(coalesce(email, '')) = lower(coalesce($3::text, ''))
               AND lower(btrim(name)) = lower(btrim($2::text))
          )`,
        [targetOrgId, c.name, c.email, c.phone, c.role, CONTACT_SOURCE, c.created_at, c.updated_at],
      );
      if (res.rowCount === 1) contactsInserted += 1;
      else contactsSkipped += 1;
    }

    await target.query('COMMIT');

    // --- post-conditions ---------------------------------------------------
    const counts = (
      await target.query(
        `SELECT
           (SELECT count(*)::int FROM organizations)      AS organizations,
           (SELECT count(*)::int FROM organization_sports) AS organization_sports,
           (SELECT count(*)::int FROM contacts)            AS contacts,
           (SELECT count(*)::int FROM markets)             AS markets`,
      )
    ).rows[0];

    console.log('TUF Ops 2.0 — Wave 1B MN Market Universe intelligence import');
    console.log(`  legacy source stream : ${UNIVERSE_SOURCE} (read-only)`);
    console.log(`  organizations        : read ${orgs.length}  ->  created ${orgsCreated}, reconciled ${orgsReconciled}`);
    console.log(`  organization_sports  : read ${sports.length}  ->  inserted ${sportsInserted}, skipped ${sportsSkipped}`);
    console.log(`  contacts             : read ${contacts.length}  ->  imported ${contactsInserted}, excluded ${excludedContacts.length}, skipped ${contactsSkipped}`);
    console.log('  excluded contacts (non-intelligence name residue):');
    for (const c of excludedContacts) {
      console.log(`    - legacy contact ${c.id} (org ${c.organization_id}): "${c.name}"`);
    }
    console.log(`  target totals        : organizations=${counts.organizations}, organization_sports=${counts.organization_sports}, contacts=${counts.contacts}, markets=${counts.markets}`);

    if (counts.markets !== marketsBefore) {
      throw new Error(`MARKET INTEGRITY FAILED: markets changed from ${marketsBefore} to ${counts.markets}`);
    }
    if (counts.organizations !== orgs.length) {
      throw new Error(
        `UNIVERSE INTEGRITY FAILED: expected ${orgs.length} organizations, found ${counts.organizations}`,
      );
    }
  } catch (error) {
    try {
      await target.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw error;
  } finally {
    await legacy.end().catch(() => {});
    await target.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error('Wave 1B universe import FAILED:', error?.stack ?? error?.message ?? error);
  process.exit(1);
});
