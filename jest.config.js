export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  moduleNameMapper: {
    '^@packages/(.*)$': '<rootDir>/packages/$1/src',
  },
};
