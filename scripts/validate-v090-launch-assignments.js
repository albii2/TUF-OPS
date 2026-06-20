#!/usr/bin/env node
const { Client } = require('pg');
require('dotenv').config();

async function validateLaunchAssignments() {
  const databaseUrl = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ Error: Neither DATABASE_URL nor TEST_DATABASE_URL is set in environment.');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    console.log('Connected to database for launch assignments validation...');

    // 1. Verify there are no fake role labels
    const rolesRes = await client.query('SELECT DISTINCT role FROM users');
    const validRoles = new Set(['ADMIN', 'REGIONAL_DIRECTOR', 'DIRECTOR', 'REP']);
    for (const row of rolesRes.rows) {
      if (!validRoles.has(row.role)) {
        throw new Error(`Invalid/fake user role found in database: ${row.role}`);
      }
    }
    console.log('✅ No fake role labels found.');

    // 2. Brad is ADMIN/National
    const bradRes = await client.query(`
      SELECT count(*)::int AS count FROM users 
      WHERE role = 'ADMIN' 
        AND (lower(name) LIKE '%bradshaw%' OR lower(email) = 'owner@tuf.local')
        AND region = 'National'
    `);
    if (bradRes.rows[0].count < 1) {
      throw new Error('Brad is not configured as ADMIN with National scope.');
    }
    console.log('✅ Brad is ADMIN/National.');

    // 3. Primeau is DIRECTOR/MN/General/Metro + North
    const primeauRes = await client.query(`
      SELECT count(*)::int AS count FROM users 
      WHERE role = 'DIRECTOR' 
        AND (lower(name) LIKE '%primeau%' OR lower(email) = 'primeau.hill@tufsports.us')
        AND state_market = 'MN'
        AND division = 'General'
        AND subterritory = 'Metro + North'
    `);
    if (primeauRes.rows[0].count < 1) {
      throw new Error('Primeau is not configured as DIRECTOR with MN/General/Metro + North scope.');
    }
    console.log('✅ Primeau is DIRECTOR/MN/General/Metro + North.');

    // Get Primeau's user ID
    const pIdRes = await client.query("SELECT id FROM users WHERE lower(name) LIKE '%primeau%' OR lower(email) = 'primeau.hill@tufsports.us' LIMIT 1");
    const primeauId = pIdRes.rows[0]?.id;

    // 4. Jason, David, Josh, Shayla each have 30 schools
    const reps = ['Jason Mulder', 'David Lundberg', 'Josh Hoffman', 'Shayla Hilliard'];
    for (const repName of reps) {
      const repRes = await client.query(`
        SELECT u.id, count(o.id)::int AS count 
        FROM users u 
        LEFT JOIN organizations o ON o.assigned_rep_id = u.id 
        WHERE lower(u.name) = lower($1)
        GROUP BY u.id
      `, [repName]);
      const count = repRes.rows[0]?.count ?? 0;
      if (count !== 30) {
        throw new Error(`Rep ${repName} has ${count} schools instead of 30.`);
      }
    }
    console.log('✅ Reps Jason, David, Josh, Shayla each have exactly 30 schools.');

    // 5. Primeau director pool has 45 schools
    const dirPoolRes = await client.query(`
      SELECT count(*)::int AS count FROM organizations 
      WHERE assigned_director_id = $1 AND assigned_rep_id IS NULL
    `, [primeauId]);
    const dirPoolCount = dirPoolRes.rows[0].count;
    if (dirPoolCount !== 45) {
      throw new Error(`Primeau director pool has ${dirPoolCount} schools instead of 45.`);
    }
    console.log('✅ Primeau director pool has exactly 45 schools.');

    // 6. 95 future/rep-pool schools are zoned but not rep-assigned
    const repPoolRes = await client.query(`
      SELECT count(*)::int AS count FROM organizations 
      WHERE assigned_rep_id IS NULL AND (assigned_director_id IS NULL OR assigned_director_id != $1)
    `, [primeauId]);
    const repPoolCount = repPoolRes.rows[0].count;
    if (repPoolCount !== 95) {
      throw new Error(`Future/rep-pool has ${repPoolCount} schools instead of 95.`);
    }
    console.log('✅ 95 future/rep-pool schools are zoned but not rep-assigned.');

    // 7. 0 unassigned zones in the Minnesota launch
    const unassignedRes = await client.query(`
      SELECT count(*)::int AS count FROM organizations 
      WHERE lower(tuf_zone) = 'unassigned' OR tuf_zone IS NULL
    `);
    const unassignedCount = unassignedRes.rows[0].count;
    if (unassignedCount !== 0) {
      throw new Error(`Found ${unassignedCount} unassigned zone records.`);
    }
    console.log('✅ 0 unassigned zones in the Minnesota launch.');

    console.log('🎉 All launch assignment count validations passed!');
  } catch (err) {
    console.error('❌ Validation Failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

validateLaunchAssignments();
