import { test, expect } from '@playwright/test';

test.describe('Core Application Workflow', () => {
  test('should allow a user to log in and see the dashboard', async ({ page }) => {
    // 1. Login
    await page.goto('/');
    await page.fill('input[name="email"]', 'admin@tuf.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // 2. Verify Dashboard
    await expect(page.getByText('Welcome back, Admin User')).toBeVisible();
    await expect(page.getByText('Open Pipeline')).toBeVisible();
  });
});
