// Run migration: add classification fields to executive_intake
const { Client } = require('pg');

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // Add columns (IF NOT EXISTS is safe to re-run)
  await c.query(`
    ALTER TABLE executive_intake 
    ADD COLUMN IF NOT EXISTS attention_score INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS classification_type TEXT,
    ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS related_person_id INTEGER REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS related_organization_id INTEGER REFERENCES organizations(id)
  `);
  console.log('✅ Added classification columns');

  // Create indexes
  await c.query(`CREATE INDEX IF NOT EXISTS idx_intake_attention ON executive_intake(attention_score DESC) WHERE status = 'open'`);
  await c.query(`CREATE INDEX IF NOT EXISTS idx_intake_classification ON executive_intake(classification_type) WHERE status = 'open'`);
  console.log('✅ Created indexes');

  // Verify
  const cols = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'executive_intake' AND column_name IN ('attention_score','classification_type','due_date','related_person_id','related_organization_id')");
  console.log('Columns:', cols.rows.map(r => r.column_name).join(', '));

  await c.end();
  console.log('✅ Migration complete');
})().catch(e => { console.error(e.message); process.exit(1); });
