import { test, expect } from '@playwright/test';

test.describe('Core Application Workflow', () => {
  test('should allow a user to log in and see the dashboard', async ({ page }) => {
    await page.goto('/auth/signin');

    await page.fill('input[name="email"]', 'admin@tufops.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard$/);

    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /organizations/i })).toBeVisible();
  });
});
