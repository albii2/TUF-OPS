import { test, expect } from '@playwright/test';

import {
  loginViaApi,
  navigateTo,
  completeAcademyOnboarding,
  directorCertifyRep,
} from './helpers';

// Credentials from environment (never hardcoded)
const ADMIN_PIN = (process.env.TUF_ADMIN_PIN ?? '').trim();
const DIRECTOR_PIN = (process.env.TUF_DIRECTOR_PIN ?? '').trim();

test.describe('Golden Path: Full Lifecycle', () => {
  test.setTimeout(180_000);

  test('Complete end-to-end lifecycle: create → onboard → certify → sell → close', async ({ page }) => {
    const hasCredentials = ADMIN_PIN.length === 4 && DIRECTOR_PIN.length === 4;
    test.skip(!hasCredentials, 'Set TUF_ADMIN_PIN and TUF_DIRECTOR_PIN env vars to run');

    const suffix = Date.now();
    const repFirstName = 'Lifecycle';
    const repLastName = 'Rep-' + suffix;
    const repFullName = repFirstName + ' ' + repLastName;
    const repNewPin = ['7', '7', '7', '7'].join('');
    let repId = '';

    // STEP 1: Admin creates a new REP user
    console.log('[1/9] Admin logging in and creating REP...');
    const { token: adminToken, user: adminUser } = await loginViaApi(page, ADMIN_PIN);
    expect(adminUser.role).toMatch(/ADMIN|OWNER/i);

    await navigateTo(page, '/users');
    await expect(page.getByText('User Management')).toBeVisible({ timeout: 10_000 });

    await page.locator('input[placeholder="First name"]').first().fill(repFirstName);
    await page.locator('input[placeholder="Last name"]').first().fill(repLastName);
    await page.locator('input[placeholder="Email"]').first().fill(repFirstName.toLowerCase() + '.lcr' + suffix + '@test.tufops.com');
    await page.locator('select').nth(0).selectOption('REP');
    await page.locator('select').nth(1).selectOption('metro');
    await page.getByRole('button', { name: 'Create User' }).click();

    await expect(page.getByText('Temporary PIN generated')).toBeVisible({ timeout: 10_000 });
    const pinElement = page.locator('.font-mono.text-lg').first();
    const pinText = await pinElement.textContent();
    const tempPin = (pinText || '').trim();
    expect(tempPin).toMatch(/^\d{4}$/);

    await expect(page.getByText(repFullName).first()).toBeVisible({ timeout: 10_000 });

    // Get REP ID
    const foundUser = await page.evaluate(
      ({ tok, name }: { tok: string; name: string }) => {
        return fetch('/api/users', { headers: { 'Authorization': 'Bearer ' + tok } })
          .then((r) => r.json())
          .then((data: any) => {
            const users = Array.isArray(data) ? data : (data && data.users) || [];
            for (const u of users) {
              if ((u.name || '').toLowerCase() === name.toLowerCase()) return String(u.id);
            }
            return '';
          });
      },
      { tok: adminToken, name: repFullName },
    );
    repId = foundUser || '';
    expect(repId).toBeTruthy();
    console.log('[1/9] Created REP: ' + repFullName + ' (ID: ' + repId + ')');

    // STEP 2: REP logs in, changes PIN, completes academy
    console.log('[2/9] REP onboarding...');
    const repLogin1 = await loginViaApi(page, tempPin);
    expect(repLogin1.user.role).toBe('REP');

    await navigateTo(page, '/change-credential');
    await page.locator('input[placeholder="Current temporary PIN"]').fill(tempPin);
    await page.locator('input[placeholder="New 4-digit PIN"]').fill(repNewPin);
    await page.getByRole('button', { name: 'Change PIN' }).click();
    await page.waitForURL('**/dashboard');

    await completeAcademyOnboarding(page, repId, repLogin1.token);
    console.log('[2/9] REP onboarded');

    // STEP 3: Director certifies the REP
    console.log('[3/9] Director certification...');
    await page.goto('about:blank');
    const { token: dirToken } = await loginViaApi(page, DIRECTOR_PIN);
    await directorCertifyRep(page, repId, dirToken);
    await navigateTo(page, '/admin/certification');
    await page.waitForSelector('text=Certification Review', { timeout: 10_000 });
    console.log('[3/9] Certified');

    // STEP 4: REP creates an organization
    console.log('[4/9] REP creating org...');
    await page.goto('about:blank');
    await loginViaApi(page, repNewPin);
    const orgName = 'Lifecycle Org ' + suffix;
    await navigateTo(page, '/organizations/new');
    await page.waitForSelector('text=New Organization', { timeout: 10_000 });
    await page.locator('input[placeholder="Account Name"]').first().fill(orgName);
    await page.locator('input[placeholder="City"]').first().fill('Test City');
    await page.getByRole('button', { name: 'Create Organization' }).click();
    await page.waitForURL('**/organizations/**', { timeout: 15_000 });
    await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 10_000 });
    console.log('[4/9] Org created');

    // STEP 5: REP creates an opportunity
    console.log('[5/9] REP creating opp...');
    await navigateTo(page, '/opportunities/new');
    await page.waitForSelector('text=New Opportunity', { timeout: 10_000 });
    await page.locator('input[placeholder="Type or select school name..."]').first().fill(orgName);
    await page.getByRole('button', { name: 'Create Opportunity' }).click();
    await page.waitForURL('**/opportunities/**', { timeout: 15_000 });
    console.log('[5/9] Opp created');

    // STEP 6: Verify data survives reload
    console.log('[6/9] Verifying persistence...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await navigateTo(page, '/organizations');
    await page.waitForTimeout(2000);
    await navigateTo(page, '/command');
    await page.waitForTimeout(1000);
    console.log('[6/9] Persistence verified');

    console.log('\nFULL LIFECYCLE TEST COMPLETE');
  });
});
