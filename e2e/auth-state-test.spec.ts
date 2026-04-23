import { test, expect } from '@playwright/test';

test('verify saved auth state works', async ({ page }) => {
  await page.goto('/dashboard');

  await page.waitForURL('**/dashboard');

  // This proves you're not redirected
  await expect(page).not.toHaveURL(/auth\/signin/);

  // Use something guaranteed in layout (sidebar/nav)
  await expect(
    page.getByRole('link', { name: /organizations/i })
  ).toBeVisible();
});
