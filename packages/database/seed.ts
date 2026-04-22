require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
import { Client } from 'pg';

const MOCK_ORGANIZATIONS = [
  { name: 'Northwood High School Football', created_by: 1, updated_by: 1 },
  { name: 'University of Irvine Soccer', created_by: 1, updated_by: 1 },
  { name: 'Mater Dei Basketball', created_by: 1, updated_by: 1 },
  { name: 'South Coast College Volleyball', created_by: 1, updated_by: 1 },
];

const CHANNELS = ['UNIFORM', 'TRAVEL_GEAR', 'TEAM_STORE', 'LETTERMAN'];

const STAGES = ['NOT_STARTED', 'NEEDS_ASSESSMENT', 'NEEDS_MOCKUP', 'NEEDS_QUOTE', 'QUOTE_SENT', 'CLOSED_WON', 'CLOSED_LOST'];

const getRandomStage = () => STAGES[Math.floor(Math.random() * STAGES.length)];

async function seed() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL environment variable not set.');
    return;
  }
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  console.log('Seeding database...');

  try {
    // Clear existing data
    await client.query('TRUNCATE TABLE opportunities, organizations RESTART IDENTITY CASCADE');
    console.log('Cleared existing data.');

    for (const orgData of MOCK_ORGANIZATIONS) {
      const orgRes = await client.query(
        'INSERT INTO organizations (name, created_by, updated_by, status) VALUES ($1, $2, $3, $4) RETURNING id',
        [orgData.name, orgData.created_by, orgData.updated_by, 'active']
      );
      const orgId = orgRes.rows[0].id;
      console.log(`Created organization: ${orgData.name} (ID: ${orgId})`);

      for (const channel of CHANNELS) {
        await client.query(
          'INSERT INTO opportunities (organization_id, channel_type, stage, value, next_action, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [orgId, channel, 'NOT_STARTED', 0, 'Initial outreach', 1, 1]
        );
      }
      console.log(`  - Created 4 channel opportunities`);

      // Update some for variety
      await client.query('UPDATE opportunities SET stage = $1, value = $2, next_action = $3 WHERE organization_id = $4 AND channel_type = $5', 
        [getRandomStage(), 50000, 'Follow up on quote', orgId, 'UNIFORM']
      );
      await client.query('UPDATE opportunities SET stage = $1, value = $2, next_action = $3 WHERE organization_id = $4 AND channel_type = $5', 
        [getRandomStage(), 15000, 'Send catalog', orgId, 'TEAM_STORE']
      );
       console.log(`  - Updated 2 opportunities for variety`);
    }
    console.log('Database seeding complete.');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await client.end();
  }
}

seed();
