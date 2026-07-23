const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  
  await c.query(`
    CREATE TABLE IF NOT EXISTS issues (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100) NOT NULL DEFAULT 'bug',
      severity VARCHAR(50) NOT NULL DEFAULT 'medium',
      affected_module VARCHAR(100),
      steps_to_reproduce TEXT,
      screenshot_url TEXT,
      is_blocking BOOLEAN DEFAULT false,
      status VARCHAR(50) NOT NULL DEFAULT 'NEW',
      submitted_by INT REFERENCES users(id),
      assigned_to INT REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
    CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);
    CREATE INDEX IF NOT EXISTS idx_issues_submitted_by ON issues(submitted_by);
  `);
  
  console.log('Issues table created');
  
  // Verify
  const cols = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name='issues' ORDER BY ordinal_position");
  console.log('Columns:', cols.rows.map(r => r.column_name).join(', '));
  
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
