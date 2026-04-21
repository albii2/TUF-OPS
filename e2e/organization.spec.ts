import { test, expect } from '@playwright/test';
import { createOrganization, editOrganization } from './flows/organization';

test.describe('Organization Flow', () => {
  test('should allow a user to create and view an organization', async ({ page }) => {
    const orgName = `Test Organization ${Date.now()}`;
    const orgData = {
      name: orgName,
      zoho_account_id: '12345'
    };

    await createOrganization(page, orgData);
    
    await page.waitForURL('**/organizations');
    await expect(page.getByText(orgName)).toBeVisible();
  });

  test('should allow a user to edit an organization', async ({ page }) => {
    const orgName = `Test Organization ${Date.now()}`;
    const orgData = {
      name: orgName,
      zoho_account_id: '12345'
    };
    await createOrganization(page, orgData);
    await page.waitForURL('**/organizations');

    const newOrgName = `Edited Organization ${Date.now()}`;
    const newOrgData = {
      name: newOrgName,
      zoho_account_id: '54321'
    };

    await editOrganization(page, orgName, newOrgData);
    
    await page.waitForURL('**/organizations');
    await expect(page.getByText(newOrgName)).toBeVisible();
  });
});
