const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');
const { assertNonDestructiveSeedAllowed } = require('./seed_safety.js');

const DEFAULT_CHANNELS = ['UNIFORM', 'TRAVEL_GEAR', 'TEAM_STORE', 'LETTERMAN'];
const DEFAULT_SPORT = 'FOOTBALL';
const DEFAULT_SEASON = 'FALL';
const DEFAULT_YEAR = 2026;
const LEAD_SOURCE = 'tuf_leads_final_enriched.csv';
const EXPECTED_HEADERS = [
  'school_name', 'school_url', 'school_colors', 'address', 'phone_number', 'enrollment', 'isd_number', 'website_link',
  'activities_director_name', 'activities_director_email', 'activities_director_phone_number',
  'football_offered', 'football_urls', 'basketball_offered', 'basketball_urls', 'hockey_offered', 'hockey_urls', 'baseball_offered', 'baseball_urls',
  'tuf_zone', 'tuf_priority',
];
const SPORT_COLUMNS = [
  { sport: 'FOOTBALL', offered: 'football_offered', url: 'football_urls' },
  { sport: 'BASKETBALL', offered: 'basketball_offered', url: 'basketball_urls' },
  { sport: 'HOCKEY', offered: 'hockey_offered', url: 'hockey_urls' },
  { sport: 'BASEBALL', offered: 'baseball_offered', url: 'baseball_urls' },
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
  const rawAddress = String(address || '').replace(/\s+/g, ' ').trim();
  const normalized = rawAddress.replace(/\s+,/g, ',');
  const match = normalized.match(/^(.+?)\s*,\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);
  if (!match) return { rawAddress, addressLine1: rawAddress || null, city: 'TBD', state: 'MN', postalCode: null };

  const streetAndCity = match[1].trim();
  const state = match[2].toUpperCase();
  const postalCode = match[3];
  const words = streetAndCity.split(' ').filter(Boolean);
  const streetTerminators = new Set([
    'avenue', 'ave', 'boulevard', 'blvd', 'circle', 'cir', 'court', 'ct', 'drive', 'dr', 'east', 'highway', 'hwy', 'lane', 'ln',
    'north', 'parkway', 'pkwy', 'place', 'pl', 'road', 'rd', 'se', 'south', 'street', 'st', 'trail', 'way', 'west',
  ]);
  const directionals = new Set(['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']);
  const cleanToken = (word) => word.toLowerCase().replace(/\.$/, '');
  const terminatorIndex = words.reduce((lastIndex, word, index) => (streetTerminators.has(cleanToken(word)) ? index : lastIndex), -1);
  const rawCityWords = terminatorIndex >= 0 ? words.slice(terminatorIndex + 1) : words.slice(-2);
  const cityWords = [...rawCityWords];
  while (cityWords.length && directionals.has(cleanToken(cityWords[0]))) cityWords.shift();
  const city = cityWords.join(' ') || 'TBD';
  const addressLine1 = terminatorIndex >= 0 ? words.slice(0, terminatorIndex + 1).join(' ') : streetAndCity.replace(new RegExp(`${city}$`), '').trim();
  return { rawAddress, addressLine1: addressLine1 || streetAndCity, city, state, postalCode };
}

function normalizeZone(rawZone, city = '') {
  const value = String(rawZone || '').trim();
  const lower = value.toLowerCase();
  if (lower === 'tuf metro' || lower === 'metro') return 'TUF Metro';
  if (lower === 'tuf north' || lower === 'north') return 'TUF North';
  if (lower === 'tuf west' || lower === 'west') return 'TUF West';
  if (lower === 'tuf south' || lower === 'south') return 'TUF South';
  if (lower === 'tuf east' || lower === 'east') return 'TUF Metro';
  if (lower === 'unassigned') return 'Unassigned';
  const cityKey = String(city || '').toLowerCase();
  if (/duluth|st\.? cloud|anoka|elk river|andover|blaine|champlin|coon rapids|forest lake/.test(cityKey)) return 'TUF North';
  if (/minneapolis|st\.? paul|saint paul|bloomington|richfield|woodbury|stillwater|hastings|prior lake|shakopee|burnsville|savage|minnetonka/.test(cityKey)) return 'TUF Metro';
  return value || 'Unassigned';
}

function priorityFromLead(rawPriority) {
  const value = String(rawPriority || '').toLowerCase();
  if (value.includes('tier 1') || value.includes('tier1')) return 'TIER_1';
  if (value.includes('tier 2') || value.includes('tier2')) return 'TIER_2';
  if (value.includes('tier 3') || value.includes('tier3')) return 'TIER_3';
  return 'UNASSIGNED';
}

function parseInteger(value) {
  const parsed = Number.parseInt(String(value || '').replace(/,/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOffered(value) {
  return ['yes', 'true', '1', 'y'].includes(String(value || '').trim().toLowerCase());
}

function assertExpectedHeaders(keys) {
  const missing = EXPECTED_HEADERS.filter((header) => !keys.includes(header));
  if (missing.length) throw new Error(`Lead CSV is missing expected headers: ${missing.join(', ')}`);
}

function sportRowsFromRaw(raw) {
  return SPORT_COLUMNS.map(({ sport, offered, url }) => ({
    sport,
    offered: parseOffered(raw[offered]),
    url: raw[url] || null,
  }));
}

function leadRowsFromCsv(csvPath) {
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const [header, ...body] = rows;
  const keys = header.map((key) => key.trim().toLowerCase());
  assertExpectedHeaders(keys);
  return body.map((line) => {
    const raw = Object.fromEntries(keys.map((key, index) => [key, String(line[index] || '').trim()]));
    const { rawAddress, city, state, postalCode, addressLine1 } = parseAddress(raw.address);
    return {
      name: normalizeAccountName(raw.school_name),
      schoolUrl: raw.school_url || null,
      schoolColors: raw.school_colors || null,
      fullAddress: rawAddress || null,
      addressLine1,
      city,
      state,
      postalCode,
      phone: raw.phone_number || null,
      enrollment: parseInteger(raw.enrollment),
      isdNumber: raw.isd_number || null,
      websiteLink: raw.website_link || null,
      athleticDirectorName: raw.activities_director_name || null,
      athleticDirectorEmail: raw.activities_director_email ? raw.activities_director_email.toLowerCase() : null,
      athleticDirectorPhone: raw.activities_director_phone_number || raw.phone_number || null,
      priority: priorityFromLead(raw.tuf_priority),
      zone: normalizeZone(raw.tuf_zone, city),
      sports: sportRowsFromRaw(raw),
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

async function getPrimeauDirectorId(client) {
  try {
    const result = await client.query("SELECT id FROM users WHERE lower(email) = 'primeau.hill@tufsports.us' OR lower(name) = 'primeau hill' ORDER BY id LIMIT 1");
    return result.rows[0]?.id || null;
  } catch {
    return null;
  }
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

async function upsertOrganization(client, lead, actorUserId, primeauDirectorId) {
  const assignedDirectorId = primeauDirectorId && ['TUF Metro', 'TUF North'].includes(lead.zone) ? primeauDirectorId : null;
  const existing = await client.query(
    `SELECT id, state, assigned_rep_id, assigned_director_id
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
       SET state = $2::varchar,
           school_url = $4::text,
           school_colors = $5::text,
           full_address = $6::text,
           address_line1 = $7::text,
           city = $8::varchar,
           postal_code = $9::varchar,
           school_phone = $10::varchar,
           enrollment = $11::integer,
           isd_number = $12::varchar,
           website_link = $13::text,
           tuf_zone = $14::varchar,
           tuf_priority = $15::varchar,
           lead_source = $16::varchar,
           lead_metadata = COALESCE(lead_metadata, '{}'::jsonb) || $17::jsonb,
           assigned_director_id = CASE WHEN $18::integer IS NOT NULL THEN $18::integer ELSE assigned_director_id END,
           updated_by = $3::integer,
           updated_at = current_timestamp
       WHERE id = $1::integer
       RETURNING id, assigned_rep_id, assigned_director_id`,
      [existing.rows[0].id, lead.state, actorUserId, lead.schoolUrl, lead.schoolColors, lead.fullAddress, lead.addressLine1, lead.city, lead.postalCode, lead.phone, lead.enrollment, lead.isdNumber, lead.websiteLink, lead.zone, lead.priority, LEAD_SOURCE, JSON.stringify({ csv: LEAD_SOURCE }), assignedDirectorId],
    );
    return { id: existing.rows[0].id, assigned_rep_id: existing.rows[0].assigned_rep_id, assigned_director_id: assignedDirectorId || existing.rows[0].assigned_director_id, created: false };
  }

  const inserted = await client.query(
    `INSERT INTO organizations (
       name, state, school_url, school_colors, full_address, address_line1, city, postal_code, school_phone, enrollment, isd_number, website_link,
       tuf_zone, tuf_priority, lead_source, lead_metadata, assigned_director_id, status, created_by, updated_by
     )
     VALUES ($1::varchar, $2::varchar, $4::text, $5::text, $6::text, $7::text, $8::varchar, $9::varchar, $10::varchar, $11::integer, $12::varchar, $13::text, $14::varchar, $15::varchar, $16::varchar, $17::jsonb, $18::integer, 'active', $3::integer, $3::integer)
     RETURNING id, assigned_rep_id, assigned_director_id`,
    [lead.name, lead.state, actorUserId, lead.schoolUrl, lead.schoolColors, lead.fullAddress, lead.addressLine1, lead.city, lead.postalCode, lead.phone, lead.enrollment, lead.isdNumber, lead.websiteLink, lead.zone, lead.priority, LEAD_SOURCE, JSON.stringify({ csv: LEAD_SOURCE }), assignedDirectorId],
  );
  return { id: inserted.rows[0].id, assigned_rep_id: inserted.rows[0].assigned_rep_id, assigned_director_id: inserted.rows[0].assigned_director_id, created: true };
}

async function ensureContacts(client, organizationId, lead) {
  if (!lead.athleticDirectorName && !lead.athleticDirectorEmail && !lead.athleticDirectorPhone) return false;
  const contactName = lead.athleticDirectorName || `${lead.name} Athletic Director`;
  await client.query(
    `INSERT INTO contacts (organization_id, name, email, phone, role)
     SELECT $1::integer, $2::varchar, $3::varchar, $4::varchar, 'Athletic Director / Activities Director'::varchar
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

async function ensureOpportunities(client, organization, organizationName, actorUserId) {
  const organizationId = organization.id;
  for (const channelType of DEFAULT_CHANNELS) {
    await client.query(
      `INSERT INTO opportunities (
         name, organization_id, sport, season, year, status, value, created_by, updated_by,
         stage, last_activity_date, deal_type, channel_type, assigned_rep_id, assigned_director_id
       )
       SELECT $1::varchar, $2::integer, $3::varchar, $4::varchar, $5::integer, 'open'::varchar, 0::numeric, $6::integer, $6::integer, 'LEAD_ASSIGNED'::varchar, current_timestamp, $7::varchar, $7::varchar, $8::integer, $9::integer
       WHERE NOT EXISTS (
         SELECT 1 FROM opportunities
         WHERE organization_id = $2::integer
           AND sport = $3::varchar
           AND season = $4::varchar
           AND year = $5::integer
           AND channel_type = $7::varchar
       )`,
      [`${organizationName} - ${channelType}`, organizationId, DEFAULT_SPORT, DEFAULT_SEASON, DEFAULT_YEAR, actorUserId, channelType, organization.assigned_rep_id ?? null, organization.assigned_director_id ?? null],
    );
  }

  await client.query(
    `UPDATE opportunities
     SET assigned_rep_id = COALESCE(assigned_rep_id, $2::integer),
         assigned_director_id = CASE WHEN $3::integer IS NOT NULL THEN $3::integer ELSE assigned_director_id END,
         updated_by = $4::integer,
         updated_at = current_timestamp
     WHERE organization_id = $1::integer
       AND sport = $5::varchar
       AND season = $6::varchar
       AND year = $7::integer
       AND channel_type = ANY($8::varchar[])`,
    [organizationId, organization.assigned_rep_id ?? null, organization.assigned_director_id ?? null, actorUserId, DEFAULT_SPORT, DEFAULT_SEASON, DEFAULT_YEAR, DEFAULT_CHANNELS],
  );
}

async function ensureSports(client, organizationId, lead) {
  if (!(await tableExists(client, 'organization_sports'))) return false;
  for (const sport of lead.sports) {
    await client.query(
      `INSERT INTO organization_sports (organization_id, sport, offered, url, source, created_at, updated_at)
       VALUES ($1::integer, $2::varchar, $3::boolean, $4::text, $5::varchar, current_timestamp, current_timestamp)
       ON CONFLICT (organization_id, sport)
       DO UPDATE SET offered = EXCLUDED.offered, url = EXCLUDED.url, source = EXCLUDED.source, updated_at = current_timestamp`,
      [organizationId, sport.sport, sport.offered, sport.url, LEAD_SOURCE],
    );
  }
  return true;
}

async function main() {
  assertNonDestructiveSeedAllowed({ destructive: false, label: 'lead baseline seed' });
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
    const primeauDirectorId = await getPrimeauDirectorId(client);

    let created = 0;
    let updated = 0;
    await client.query('BEGIN');
    for (const lead of leads) {
      const organization = await upsertOrganization(client, lead, actorUserId, primeauDirectorId);
      if (organization.created) created += 1;
      else updated += 1;
      if (contactsAvailable) await ensureContacts(client, organization.id, lead);
      await ensureSports(client, organization.id, lead);
      if (opportunitiesAvailable) await ensureOpportunities(client, organization, lead.name, actorUserId);
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
