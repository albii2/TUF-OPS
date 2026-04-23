require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
import { Client } from 'pg';

const CHANNELS = ['UNIFORM', 'TRAVEL_GEAR', 'TEAM_STORE', 'LETTERMAN'];

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const orgs = await client.query('SELECT id, name, assigned_rep_id, assigned_director_id, created_by, updated_by FROM organizations');

    for (const org of orgs.rows) {
      for (const channel of CHANNELS) {
        await client.query(
          `INSERT INTO opportunities (
            name, organization_id, status, value, created_by, updated_by, stage, last_activity_date,
            assigned_rep_id, assigned_director_id, deal_type, channel_type
          ) VALUES ($1,$2,'open',0,$3,$4,'NOT_STARTED',current_timestamp,$5,$6,$7,$8)
          ON CONFLICT (organization_id, channel_type) WHERE channel_type IS NOT NULL DO NOTHING`,
          [`${org.name} - ${channel}`, org.id, org.created_by ?? 1, org.updated_by ?? 1, org.assigned_rep_id, org.assigned_director_id, channel, channel]
        );
      }
    }

    console.log(`Backfilled required channels for ${orgs.rows.length} organizations.`);
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
