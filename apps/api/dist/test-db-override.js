"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const connectionString = 'postgresql://localhost:5432/tuf_test';
console.log('[FORCED TEST DB]', connectionString);
exports.pool = new pg_1.Pool({
    connectionString,
});
//# sourceMappingURL=test-db-override.js.map