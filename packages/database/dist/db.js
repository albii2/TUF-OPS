"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
const connectionString = process.env.NODE_ENV === 'test'
    ? process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/tuf_test'
    : process.env.DATABASE_URL;
exports.pool = new pg_1.Pool({
    connectionString,
});
//# sourceMappingURL=db.js.map
