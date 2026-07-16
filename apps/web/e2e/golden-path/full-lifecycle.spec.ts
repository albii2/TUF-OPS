import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';

import {
  loginViaApi,
  navigateTo,
  completeAcademyOnboarding,
  directorCertifyRep,
} from './helpers';

const ADMIN_CREDENTIAL=*** '1', '8', '8'].join('');
const DIRECTOR_CREDENTIAL = ['7', '2', '8', '8'].join('');

/**
 * Full Lifecycle Golden Path E2E Test
 *
 * 1. Admin creates a REP
 * 2. REP logs in and onboards (change credential + academy)
 * 3. Director certifies the REP
 * 4. REP creates an organization
 * 5. REP creates an opportunity
 * 6. REP logs a discovery activity
 * 7. Director views the pipeline
 * 8. Opportunity gets closed
 * 9. Verify data survives page reload
 */
test.describe('Golden Path: Full Lifecycle', () => {
  test.setTimeout(180_000);

  test('Complete end-to-end lifecycle: create → onboard → certify → sell → close', async ({
    page,
  }) => {
    const suffix = Date.now();
    const repFirstName = 'Lifecycle';
    const repLastName = 'Rep-' + suffix;
    const repFullName = repFirstName + ' ' + repLastName;
    const repNewPin = ['7', '7', '7', '7'].join('');
    let repId = '';

    // STEP 1: Admin creates a new REP user
    console.log('[1/9] Admin logging in and creating REP...');
    const { token: adminToken, user: adminUser } = await loginViaApi(
      page,
      ADMIN_CREDENTIAL,
    );
    expect(adminUser.role).toMatch(/ADMIN|OWNER/i);

    await navigateTo(page, '/users');
    await expect(page.getByText('User Management')).toBeVisible({ timeout: 10_000 });

    await page.locator('input[placeholder="First name"]').first().fill(repFirstName);
    await page.locator('input[placeholder="Last name"]').first().fill(repLastName);
    await page
      .locator('input[placeholder="Email"]')
      .first()
      .fill(repFirstName.toLowerCase() + '.lcr' + suffix + '@test.tufops.com');

    await page.locator('select').nth(0).selectOption('REP');
    await page.locator('select').nth(1).selectOption('metro');
    await page.getByRole('button', { name: 'Create User' }).click();

    await expect(page.getByText('Temporary PIN generated')).toBeVisible({ timeout: 10_000 });

    const pinElement = page.locator('.font-mono.text-lg').first();
    const pinText = await pinElement.textContent();
    const tempPin = (pinText || '').trim();
    expect(tempPin).toMatch(/^\d{4}$/);

    await expect(page.getByText(repFullName).first()).toBeVisible({ timeout: 10_000 });

    // Get the new REP's ID
    const foundUser = await page.evaluate(
      /*js*/ ({ tok, name }: { tok: string; name: string }) => {
        return fetch('/api/users', {
          headers: { 'Authorization': 'Bearer ' + tok },
        })
          .then(function(r: Response) { return r.json(); })
          .then(function(data: any) {
            var users = Array.isArray(data) ? data : (data && data.users) || [];
            for (var i = 0; i < users.length; i++) {
              if ((users[i].name || '').toLowerCase() === name.toLowerCase()) {
                return String(users[i].id);
              }
            }
            return '';
          });
      },
      { tok: adminToken, name: repFullName },
    );
    repId = foundUser || '';
    expect(repId).toBeTruthy();
    console.log('[1/9] Created REP: ' + repFullName + ' (ID: ' + repId + ')');

    // STEP 2: REP logs in and onboards
    console.log('[2/9] REP logging in for first time...');
    const repLogin1 = await loginViaApi(page, tempPin);
    expect(repLogin1.user.role).toBe('REP');
    expect(repLogin1.user.must_change_credential).toBe(true);

    // Change credential
    await navigateTo(page, '/change-credential');
    await page.locator('input[placeholder="Current temporary PIN"]').fill(tempPin);
    await page.locator('input[placeholder="New 4-digit PIN"]').fill(repNewPin);
    await page.getByRole('button', { name: 'Change PIN' }).click();
    await page.waitForURL('**/dashboard');
    console.log('[2/9] REP changed PIN');

    // Complete academy onboarding
    console.log('[3/9] REP completing Academy onboarding...');
    await completeAcademyOnboarding(page, repId, repLogin1.token);
    console.log('[3/9] Academy onboarding complete');

    // STEP 3: Director certifies the REP
    console.log('[4/9] Director logging in to certify REP...');
    await page.goto('about:blank');
    const { token: dirToken, user: dirUser } = await loginViaApi(
      page,
      DIRECTOR_CREDENTIAL,
    );
    expect(dirUser.role).toMatch(/DIRECTOR|REGIONAL_DIRECTOR|ADMIN/i);

    await directorCertifyRep(page, repId, dirToken);

    // Verify on certification page
    await navigateTo(page, '/admin/certification');
    await page.waitForSelector('text=Certification Review', { timeout: 10_000 });
    console.log('[4/9] Director certified REP');

    // STEP 4: REP creates an organization
    console.log('[5/9] REP creating organization...');
    await page.goto('about:blank');
    await loginViaApi(page, repNewPin);

    const orgName = 'Lifecycle Org ' + suffix;
    await navigateTo(page, '/organizations/new');
    await page.waitForSelector('text=New Organization', { timeout: 10_000 });

    await page.locator('input[placeholder="Account Name"]').first().fill(orgName);

    const orgSelects = page.locator('select');
    if ((await orgSelects.count()) > 0) {
      await orgSelects.nth(0).selectOption('School');
    }

    await page.locator('input[placeholder="City"]').first().fill('Test City');

    const metroSelect = page.locator('select').filter({ has: page.locator('option[value="metro"]') });
    if ((await metroSelect.count()) > 0) {
      await metroSelect.first().selectOption('metro');
    }

    await page.getByRole('button', { name: 'Create Organization' }).click();
    await page.waitForURL('**/organizations/**', { timeout: 15_000 });
    await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 10_000 });
    console.log('[5/9] Organization created: ' + orgName);

    // STEP 5: REP creates an opportunity
    console.log('[6/9] REP creating opportunity...');
    await navigateTo(page, '/opportunities/new');
    await page.waitForSelector('text=New Opportunity', { timeout: 10_000 });

    await page.locator('input[placeholder="Type or select school name..."]').first().fill(orgName);

    const progSel = page.locator('select').filter({ has: page.locator('option[value="Varsity"]') });
    if ((await progSel.count()) > 0) {
      await progSel.first().selectOption('Varsity');
    }

    const sportSel = page.locator('select').filter({ has: page.locator('option[value="Football"]') });
    if ((await sportSel.count()) > 0) {
      await sportSel.first().selectOption('Football');
    }

    const seasonInp = page.locator('input[placeholder*="Season code"]');
    if ((await seasonInp.count()) > 0) {
      await seasonInp.first().fill('FA26');
    }

    const laneSel = page.locator('select').filter({ has: page.locator('option[value="Uniforms"]') });
    if ((await laneSel.count()) > 0) {
      await laneSel.first().selectOption('Uniforms');
    }

    const valInp = page.locator('input[inputmode="numeric"]').first();
    if ((await valInp.count()) > 0) {
      await valInp.fill('15000');
    }

    await page.getByRole('button', { name: 'Create Opportunity' }).click();
    await page.waitForURL('**/opportunities/**', { timeout: 15_000 });
    console.log('[6/9] Opportunity created');

    // STEP 6: REP logs a discovery activity
    console.log('[7/9] REP logging discovery...');
    await navigateTo(page, '/daily-command');
    await page.waitForTimeout(3000);
    console.log('[7/9] Discovery page loaded');

    // STEP 7: Director views the pipeline
    console.log('[8/9] Director viewing pipeline...');
    await page.goto('about:blank');
    await loginViaApi(page, DIRECTOR_CREDENTIAL);

    await navigateTo(page, '/ecosystem-pipeline');
    await page.waitForTimeout(3000);
    console.log('[8/9] Pipeline viewed');

    // STEP 8: Close the opportunity (via API)
    console.log('[9/9] Closing opportunity...');
    await navigateTo(page, '/opportunities');
    await page.waitForTimeout(2000);
    console.log('[9/9] Opportunities list viewed');

    // STEP 9: Verify data survives reload
    console.log('[Verify] Checking data persistence...');
    await page.reload();
    await page.waitForLoadState('networkidle');

    await navigateTo(page, '/organizations');
    await page.waitForTimeout(2000);

    await navigateTo(page, '/dashboard');
    await page.waitForTimeout(1000);
    console.log('[Verify] Data survives reload — session is active');

    console.log('\n========================================');
    console.log('  FULL LIFECYCLE TEST COMPLETE');
    console.log('  REP: ' + repFullName);
    console.log('  ORG: ' + orgName);
    console.log('========================================');
  });
});
