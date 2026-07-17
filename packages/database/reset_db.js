"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
function parseDbUrl(rawUrl) {
    const url = new URL(rawUrl);
    const database = url.pathname.replace(/^\//, '');
    if (!database) {
        throw new Error('TEST_DATABASE_URL must include a database name');
    }
    const adminUrl = new URL(rawUrl);
    adminUrl.pathname = '/postgres';
    return {
        database,
        adminConnectionString: adminUrl.toString(),
    };
}
async function resetDatabase() {
    const testDatabaseUrl = process.env.TEST_DATABASE_URL;
    if (!testDatabaseUrl) {
        throw new Error('TEST_DATABASE_URL is not set');
    }
    const { database, adminConnectionString } = parseDbUrl(testDatabaseUrl);
    const client = new pg_1.Client({ connectionString: adminConnectionString });
    await client.connect();
    try {
        await client.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`, [database]);
        await client.query(`DROP DATABASE IF EXISTS \"${database}\"`);
        await client.query(`CREATE DATABASE \"${database}\"`);
        console.log(`Reset database: ${database}`);
    }
    finally {
        await client.end();
    }
}
resetDatabase().catch((error) => {
    console.error('Database reset failed:', error);
    process.exit(1);
});
//# sourceMappingURL=reset_db.js.map