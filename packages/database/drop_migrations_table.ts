const { Client } = require("pg");
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect();
client.query("DROP TABLE IF EXISTS pgmigrations").then(() => {
  console.log('pgmigrations table dropped');
  client.end();
});
