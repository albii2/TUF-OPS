export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    // Resolve TS relative imports that carry an explicit `.js` extension
    // (the ESM/NodeNext convention used across packages/shared) back to the
    // sibling `.ts` file, so jest can load the canonical 2.0 types.
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '\\.(css|less|scss)$': '<rootDir>/src/__mocks__/styleMock.js',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
};
