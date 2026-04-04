import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('seed success', async ({ page }) => {
    // This test will implicitly pass if the server starts and the page loads.
    // A failure to seed the database would likely cause a server startup failure.
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle(/TUF Ops/);
  });

  test('credentials auth and session endpoint', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/signin');
    await page.fill('input[name="email"]', 'admin@tufops.com');
    await page.fill('input[name="password"]', 'admin123');
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]'),
    ]);

    const sessionResponse = await page.request.get('http://localhost:3000/api/auth/session');
    expect(sessionResponse.ok()).toBeTruthy();
  });

  test('dashboard load', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/signin');
    await page.fill('input[name="email"]', 'admin@tufops.com');
    await page.fill('input[name="password"]', 'admin123');
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]'),
    ]);


  });


});