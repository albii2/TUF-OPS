const runner = require('node-pg-migrate').default;
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const matched = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (matched) {
      const key = matched[1];
      let value = matched[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

async function run() {
  const databaseUrl = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL or TEST_DATABASE_URL is not set');
    process.exit(1);
  }
  console.log('Running migrations programmatically on:', databaseUrl);
  await runner({
    databaseUrl,
    direction: 'up',
    dir: path.join(__dirname, 'migrations'),
    migrationsTable: 'pgmigrations',
    verbose: true,
  });
  console.log('Migrations completed successfully!');
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
