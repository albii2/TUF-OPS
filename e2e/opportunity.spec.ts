import { test, expect } from '@playwright/test';
import { createOpportunity } from './flows/opportunity';
import { createOrganization } from './flows/organization';

test.describe('Opportunity Flow', () => {
  test('should allow a user to create an opportunity', async ({ page }) => {
    const orgName = `Test Organization ${Date.now()}`;
    const orgData = {
      name: orgName,
      zoho_account_id: '12345'
    };
    await createOrganization(page, orgData);

    // Force navigation refresh
    await page.goto('/opportunities/new');

    const oppName = `Test Opportunity ${Date.now()}`;
    const oppData = {
      name: oppName,
      organization_id: orgName, // Use org name to select from dropdown
      stage: 'Prospect',
      estimated_value: '10000',
      probability: '50'
    };

    await createOpportunity(page, oppData);

    await expect(page.getByText(oppName)).toBeVisible();
  });
});
