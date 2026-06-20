const { Client } = require('pg');
require('dotenv').config();

async function validateDbReadiness() {
  const databaseUrl = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ Error: Neither DATABASE_URL nor TEST_DATABASE_URL is set in environment.');
    process.exit(1);
  }

  console.log('Connecting to database to verify readiness...');
  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log('✅ Connected to database successfully.');

    // 1. Verify required tables exist
    const tablesToCheck = ['training_modules', 'training_assessments', 'users'];
    for (const table of tablesToCheck) {
      const res = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        );`,
        [table]
      );
      if (res.rows[0].exists) {
        console.log(`✅ Table "${table}" exists.`);
      } else {
        console.error(`❌ Error: Table "${table}" is missing.`);
        process.exit(1);
      }
    }

    // 2. Verify Academy modules exist
    const modulesRes = await client.query('SELECT COUNT(*)::int AS count FROM training_modules');
    const moduleCount = modulesRes.rows[0].count;
    if (moduleCount > 0) {
      console.log(`✅ Academy modules found in database (Count: ${moduleCount}).`);
    } else {
      console.error('❌ Error: training_modules table is empty.');
      process.exit(1);
    }

    console.log('🎉 Database readiness checks completed successfully with no destructive operations.');
  } catch (err) {
    console.error('❌ Database connection or query failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

validateDbReadiness();
