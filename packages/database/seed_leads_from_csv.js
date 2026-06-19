const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

const DEFAULT_CHANNELS = ['UNIFORM', 'TRAVEL_GEAR', 'TEAM_STORE', 'LETTERMAN'];
const DEFAULT_SPORT = 'FOOTBALL';
const DEFAULT_SEASON = 'FALL';
const DEFAULT_YEAR = 2026;

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
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field);
      if (row.some((value) => value.trim().length > 0)) rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((value) => value.trim().length > 0)) rows.push(row);
  return rows;
}

function normalizeAccountName(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function parseAddress(address) {
  const value = String(address || '').replace(/\s+/g, ' ').trim();
  const stateMatch = value.match(/\b([A-Z]{2})\s+\d{5}(?:-\d{4})?\b/);
  const state = stateMatch?.[1] || 'MN';
  const beforeState = stateMatch ? value.slice(0, stateMatch.index).trim() : value;
  const cityMatch = beforeState.match(/([^,]+)\s*,?$/);
  const city = cityMatch?.[1]?.trim() || 'TBD';
  return { city, state };
}

function priorityFromLead(rawPriority) {
  const value = String(rawPriority || '').toLowerCase();
  if (value.includes('tier 1') || value.includes('tier1')) return 'TIER_1';
  if (value.includes('tier 2') || value.includes('tier2')) return 'TIER_2';
  if (value.includes('tier 3') || value.includes('tier3')) return 'TIER_3';
  return 'UNASSIGNED';
}

function leadRowsFromCsv(csvPath) {
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const [header, ...body] = rows;
  const keys = header.map((key) => key.trim().toLowerCase());
  return body.map((line) => {
    const raw = Object.fromEntries(keys.map((key, index) => [key, String(line[index] || '').trim()]));
    const { city, state } = parseAddress(raw.address);
    return {
      name: normalizeAccountName(raw.school_name),
      city,
      state,
      phone: raw.phone_number || null,
      athleticDirectorName: raw.activities_director_name || null,
      athleticDirectorEmail: raw.activities_director_email ? raw.activities_director_email.toLowerCase() : null,
      athleticDirectorPhone: raw.activities_director_phone_number || raw.phone_number || null,
      priority: priorityFromLead(raw.tuf_priority),
      zone: (raw.tuf_zone && raw.tuf_zone.trim().toLowerCase() === 'tuf east') ? 'TUF Metro' : (raw.tuf_zone || null),
    };
  }).filter((lead) => lead.name.length > 0);
}

async function tableExists(client, tableName) {
  const result = await client.query(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS exists`,
    [tableName],
  );
  return Boolean(result.rows[0]?.exists);
}

async function getActorUserId(client) {
  try {
    const result = await client.query(`
      SELECT id
      FROM users
      ORDER BY CASE role WHEN 'OWNER' THEN 0 WHEN 'ADMIN' THEN 1 ELSE 2 END, id
      LIMIT 1
    `);
    return result.rows[0]?.id || 1;
  } catch {
    return 1;
  }
}

async function upsertOrganization(client, lead, actorUserId) {
  const existing = await client.query(
    `SELECT id, state
     FROM organizations
     WHERE lower(btrim(name)) = lower(btrim($1::text))
       AND (upper(btrim(coalesce(state, ''))) = upper(btrim($2::text)) OR coalesce(state, '') = '')
     ORDER BY CASE WHEN upper(btrim(coalesce(state, ''))) = upper(btrim($2::text)) THEN 0 ELSE 1 END, id
     LIMIT 1`,
    [lead.name, lead.state],
  );

  if (existing.rows[0]) {
    await client.query(
      `UPDATE organizations
       SET state = CASE WHEN coalesce(state, '') = '' THEN $2::varchar ELSE state END,
           updated_by = $3::integer,
           updated_at = current_timestamp
       WHERE id = $1::integer`,
      [existing.rows[0].id, lead.state, actorUserId],
    );
    return { id: existing.rows[0].id, created: false };
  }

  const inserted = await client.query(
    `INSERT INTO organizations (name, state, status, created_by, updated_by)
     VALUES ($1::varchar, $2::varchar, 'active', $3::integer, $3::integer)
     RETURNING id`,
    [lead.name, lead.state, actorUserId],
  );
  return { id: inserted.rows[0].id, created: true };
}

async function ensureContacts(client, organizationId, lead) {
  if (!lead.athleticDirectorName && !lead.athleticDirectorEmail && !lead.athleticDirectorPhone) return false;
  const contactName = lead.athleticDirectorName || `${lead.name} Athletic Director`;
  await client.query(
    `INSERT INTO contacts (organization_id, name, email, phone, role)
     SELECT $1::integer, $2::varchar, $3::varchar, $4::varchar, 'Athletic Director'::varchar
     WHERE NOT EXISTS (
       SELECT 1 FROM contacts
       WHERE organization_id = $1::integer
         AND lower(coalesce(email, '')) = lower(coalesce($3::text, ''))
         AND lower(name) = lower($2::text)
     )`,
    [organizationId, contactName, lead.athleticDirectorEmail, lead.athleticDirectorPhone],
  );
  return true;
}

async function ensureOpportunities(client, organizationId, organizationName, actorUserId) {
  for (const channelType of DEFAULT_CHANNELS) {
    await client.query(
      `INSERT INTO opportunities (
         name, organization_id, sport, season, year, status, value, created_by, updated_by,
         stage, last_activity_date, deal_type, channel_type
       )
       SELECT $1::varchar, $2::integer, $3::varchar, $4::varchar, $5::integer, 'open'::varchar, 0::numeric, $6::integer, $6::integer, 'LEAD_ASSIGNED'::varchar, current_timestamp, $7::varchar, $7::varchar
       WHERE NOT EXISTS (
         SELECT 1 FROM opportunities
         WHERE organization_id = $2::integer
           AND sport = $3::varchar
           AND season = $4::varchar
           AND year = $5::integer
           AND channel_type = $7::varchar
       )`,
      [`${organizationName} - ${channelType}`, organizationId, DEFAULT_SPORT, DEFAULT_SEASON, DEFAULT_YEAR, actorUserId, channelType],
    );
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required to seed bundled TUF leads');

  const csvPath = process.env.TUF_LEADS_CSV || path.resolve(__dirname, '../../apps/web/src/assets/tuf_leads_final_enriched.csv');
  const leads = leadRowsFromCsv(csvPath);
  if (!leads.length) throw new Error(`No leads found in ${csvPath}`);

  const client = new Client({ connectionString });
  await client.connect();

  try {
    if (!(await tableExists(client, 'organizations'))) throw new Error('organizations table is missing; run migrations before seeding leads');
    const contactsAvailable = await tableExists(client, 'contacts');
    const opportunitiesAvailable = await tableExists(client, 'opportunities');
    const actorUserId = await getActorUserId(client);

    let created = 0;
    let updated = 0;
    await client.query('BEGIN');
    for (const lead of leads) {
      const organization = await upsertOrganization(client, lead, actorUserId);
      if (organization.created) created += 1;
      else updated += 1;
      if (contactsAvailable) await ensureContacts(client, organization.id, lead);
      if (opportunitiesAvailable) await ensureOpportunities(client, organization.id, lead.name, actorUserId);
    }
    await client.query('COMMIT');

    console.log(`Seeded bundled TUF leads: ${created} created, ${updated} existing/updated, ${leads.length} total.`);
    if (!contactsAvailable) console.warn('contacts table is missing; skipped contact seed. Run migrations and re-run this script.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
