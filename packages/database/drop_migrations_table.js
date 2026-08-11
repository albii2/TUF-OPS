"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { Client } = require("pg");
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect();
client.query("DROP TABLE IF EXISTS pgmigrations").then(() => {
    console.log('pgmigrations table dropped');
    client.end();
});
//# sourceMappingURL=drop_migrations_table.js.map