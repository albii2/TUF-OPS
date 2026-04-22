import { Page, expect } from '@playwright/test';

export async function goTo(page: Page, path: string, entity: string, newPage: boolean = false) {
  const pageTestId = newPage ? `page-${entity}-new` : `page-${entity}`;
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await expect(page.locator(`[data-testid="${pageTestId}"]`)).toBeVisible();
}
