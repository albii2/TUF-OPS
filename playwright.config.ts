import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const baseURL = 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './e2e',
  testIgnore: '**/.*/__tests__/**',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 60 * 1000, // 60 seconds

  use: {
    baseURL: baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  webServer: {
    command: 'pnpm --filter frontend dev',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120 * 1000, // 2 minutes
    env: {
      NODE_ENV: 'development',
      NEXTAUTH_URL: baseURL,
    },
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
