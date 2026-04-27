require('dotenv').config({ path: '../../.env' });
process.env.NODE_ENV = 'test';
process.env.TEST_DATABASE_URL ||= 'postgresql://localhost:5432/tuf_test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
