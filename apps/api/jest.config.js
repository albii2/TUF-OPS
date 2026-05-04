export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.cjs'],
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@packages/database$': '<rootDir>/src/test-db-override.ts',
    '^@packages/database/(.*)$': '<rootDir>/src/test-db-override.ts',
    '^@packages/auth$': '<rootDir>/../../packages/auth/dist/index.js',
    '^@packages/env$': '<rootDir>/../../packages/env/dist/index.js',
    '^@packages/logger$': '<rootDir>/../../packages/logger/dist/index.js'
  },
};
