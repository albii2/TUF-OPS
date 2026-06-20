# v0.9.0 Lead CSV Mapping

## Source of truth

* Source file: `apps/web/src/assets/tuf_mn_leads_final.csv` for corrected launch assignments; fallback legacy file is `apps/web/src/assets/tuf_leads_final_enriched.csv`.
* Expected row count: 260 school records, excluding the header row.
* Seed script: `packages/database/seed_leads_from_csv.js`
* Schema support migration: `packages/database/migrations/1900000012000_v090_lead_csv_full_mapping.js`

The seed is idempotent and non-destructive. It upserts organizations by normalized school name/state, creates or preserves primary Athletic Director contacts, upserts sport coverage rows, and creates launch-lane opportunities only when the lane does not already exist.

## Column mapping

| CSV column | Database destination | Persisted? | Notes |
|---|---|---:|---|
| `school_name` | `organizations.name` | Yes | Normalized whitespace; used as the school/account name. |
| `school_url` | `organizations.school_url` | Yes | Raw source URL. |
| `school_colors` | `organizations.school_colors` | Yes | Preserved as source text. |
| `address` | `organizations.full_address`, `organizations.address_line1`, `organizations.city`, `organizations.state`, `organizations.postal_code` | Yes | Raw address is preserved and parsed into address components. |
| `phone_number` | `organizations.school_phone`; fallback for `contacts.phone` | Yes | Stored on the school and used if AD phone is blank. |
| `enrollment` | `organizations.enrollment` | Yes | Parsed as integer. |
| `isd_number` | `organizations.isd_number` | Yes | Preserved as source text because district numbers may contain formatting. |
| `website_link` | `organizations.website_link` | Yes | Preserved separately from `school_url`. |
| `activities_director_name` | `contacts.name` | Yes | Contact role is `Athletic Director / Activities Director`. |
| `activities_director_email` | `contacts.email` | Yes | Lower-cased for stable matching. |
| `activities_director_phone_number` | `contacts.phone` | Yes | Falls back to school phone when blank. |
| `football_offered` | `organization_sports.offered` where `sport='FOOTBALL'` | Yes | Boolean parsed from yes/true/1/y values. |
| `football_urls` | `organization_sports.url` where `sport='FOOTBALL'` | Yes | Preserved as text. |
| `basketball_offered` | `organization_sports.offered` where `sport='BASKETBALL'` | Yes | Boolean parsed from yes/true/1/y values. |
| `basketball_urls` | `organization_sports.url` where `sport='BASKETBALL'` | Yes | Preserved as text. |
| `hockey_offered` | `organization_sports.offered` where `sport='HOCKEY'` | Yes | Boolean parsed from yes/true/1/y values. |
| `hockey_urls` | `organization_sports.url` where `sport='HOCKEY'` | Yes | Preserved as text. |
| `baseball_offered` | `organization_sports.offered` where `sport='BASEBALL'` | Yes | Boolean parsed from yes/true/1/y values. |
| `baseball_urls` | `organization_sports.url` where `sport='BASEBALL'` | Yes | Preserved as text. |
| `tuf_zone` | `organizations.tuf_zone` | Yes | Canonical display values are stored. |
| `tuf_priority` | `organizations.tuf_priority` | Yes | Stored as normalized values `TIER_1`, `TIER_2`, `TIER_3`, or `UNASSIGNED`. |

## Address parsing

The full source address is always preserved in `organizations.full_address`. The seed also parses:

* `organizations.address_line1`
* `organizations.city`
* `organizations.state`
* `organizations.postal_code`

Example source format:

```text
6600 Nicollet Ave S Richfield , MN 55423-2498
```

This should preserve the raw address, parse `MN` as state, preserve `55423-2498` as postal code, and infer the street/city boundary from street suffixes and directionals.

## Zone mapping and Primeau assignment

`normalizeZone` stores these canonical values:

* `TUF Metro`
* `TUF North`
* `TUF West`
* `TUF South`
* `TUF East`
* `Unassigned`

For v0.9 launch:

* `TUF Metro` organizations are assigned to Primeau Hill as director.
* `TUF North` organizations are assigned to Primeau Hill as director.
* Other zones preserve existing assignment when present, or remain unassigned.
* Owner/Admin users remain able to see unassigned schools.
* The assignment is idempotent and safe to rerun; Metro/North rows are re-pointed to Primeau if they drift.

## Priority mapping

`tuf_priority` is normalized to:

* `TIER_1`
* `TIER_2`
* `TIER_3`
* `UNASSIGNED`

The CSV may use display values such as `Tier 1`, `Tier 2`, or `Tier 3`; those are normalized in the seed so filtering stays stable.

## Sport coverage mapping

Sport coverage is stored in `organization_sports` with one row per organization/sport:

* `organization_id`
* `sport`
* `offered`
* `url`
* `source`

Rows are upserted with `ON CONFLICT (organization_id, sport)` so re-running the seed updates coverage without duplicating sports.

## Opportunity creation behavior

The seed still creates the four owner-approved launch opportunity lanes when missing:

* `UNIFORM`
* `TRAVEL_GEAR`
* `TEAM_STORE`
* `LETTERMAN`

Each opportunity is created as:

* `stage = LEAD_ASSIGNED`
* `status = open`
* `sport = FOOTBALL`
* `season = FALL`
* `year = 2026`
* `assigned_rep_id` and `assigned_director_id` copied from the organization assignment where available

The seed uses `WHERE NOT EXISTS` and does not create duplicate opportunities on rerun. It does not create fake orders, invoices, payments, commissions, or activities.

## Safe seed command

Run migrations before seeding:

```bash
pnpm -w run db:migrate
pnpm -w run db:seed:leads
```

To seed a different CSV path without changing the repo:

```bash
TUF_LEADS_CSV=/secure/path/tuf_leads_final_enriched.csv pnpm -w run db:seed:leads
```

## Preview seed instructions

1. Confirm preview points to the preview database.
2. Run migrations.
3. Run `pnpm -w run db:seed:leads`.
4. Login as owner/admin and confirm 260 schools are present.
5. Login as Primeau/director and confirm Metro/North schools are visible.

## Production seed instructions

1. Take and verify a production Postgres backup first.
2. Confirm `NODE_ENV=production`, `VERCEL_ENV=production`, and `APP_ENV=production` are set correctly.
3. Confirm the seed command points to production `DATABASE_URL` only after backup verification.
4. Run migrations.
5. Run only the non-destructive lead seed: `pnpm -w run db:seed:leads`.
6. Do not run reset scripts, mock seeds, test-account seeds, or any destructive scripts in production.

## Manual verification checklist

* Confirm the CSV has 260 rows and the expected headers.
* Confirm every school has a persisted `full_address` and parsed `postal_code` when the source includes one.
* Confirm AD name/email/phone were persisted in `contacts`.
* Confirm sport coverage rows exist for football, basketball, hockey, and baseball.
* Confirm Metro/North schools have Primeau as `assigned_director_id`.
* Confirm West/South/East/Unassigned schools remain visible to owner/admin.
* Confirm opportunities are `LEAD_ASSIGNED` and not duplicated after rerunning the seed.
* Confirm no orders, invoices, commissions, or fake activities were created by this seed.

## Corrected launch assignment import

The lead seed now supports these optional owner-provided assignment columns when they are present in the CSV:

* `assigned_director_name`
* `assigned_director_email`
* `assigned_rep_name`
* `assigned_rep_email`
* `assignment_batch`
* `assignment_rationale`

User matching is intentionally conservative:

1. Match by assignment email first when `assigned_rep_email` or `assigned_director_email` is present.
2. Fall back to normalized user name matching.
3. If a rep name is present but no matching user exists, preserve the assignment text in `organizations.lead_metadata` and leave `assigned_rep_id` null.
4. `Primeau Director Pool` rows assign Primeau Hill as director and clear rep assignment.
5. `Future Zone Pool` rows remain unassigned so owner/admin users can manage them.

For the corrected David/Cody launch files, expected rep counts are:

| Rep | Expected schools | Assignment intent |
|---|---:|---|
| Jason Mulder | 30 | South / Southwest Metro schools |
| Josh Hoffman | 30 | West Metro / Minneapolis inner-ring schools |
| Shayla Hilliard | 30 | Northwest / North Metro schools |
| David Lundberg | 30 | North/outstate/remote-prospecting schools |
| Primeau Hill | Director pool / overflow | East Metro hold and overflow, no rep assignment |

David Lundberg is Cody / remote. His assignment rationale must reference remote, outstate, north-corridor, phone, or email-first work and must not assign the St. Paul/Woodbury/East Metro cluster to him.

Before preview or production seeding with corrected assignments, place the owner-provided file where the seed can read it, for example:

```bash
TUF_LEADS_CSV=/secure/path/tuf_mn_leads_final.csv pnpm -w run db:seed:leads
```

Run the assignment validator before seeding:

```bash
TUF_LEADS_CSV=/secure/path/tuf_mn_leads_final.csv node scripts/validate-v090-launch-assignments.js
```
