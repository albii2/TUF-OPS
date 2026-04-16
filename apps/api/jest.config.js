export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@packages/auth$': '<rootDir>/../../packages/auth/dist/index.js',
    '^@packages/database$': '<rootDir>/../../packages/database/dist/db.js',
    '^@packages/env$': '<rootDir>/../../packages/env/dist/index.js',
    '^@packages/logger$': '<rootDir>/../../packages/logger/dist/index.js'
  },
};
