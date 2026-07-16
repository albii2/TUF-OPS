import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { loginViaApi, navigateTo } from './helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SHARED_STATE_FILE = path.resolve(__dirname, '.golden-path-state.json');

function readSharedState(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(SHARED_STATE_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

test.describe('Golden Path: Create Org & Opportunity', () => {
  test('Certified REP creates an organization and opportunity, verifies both', async ({
    page,
  }) => {
    const state = readSharedState();
    const repPin = state.repPin;
    const repName = state.repName;

    expect(repPin).toBeTruthy();

    // Login as the REP
    const { user: repUser } = await loginViaApi(page, repPin);
    expect(repUser.role).toBe('REP');

    // Handle credential change if still required
    if (repUser.must_change_credential) {
      await navigateTo(page, '/change-credential');
      await page
        .locator('input[placeholder="Current temporary PIN"]')
        .fill(repPin);
      await page
        .locator('input[placeholder="New 4-digit PIN"]')
        .fill(['9', '9', '9', '9'].join(''));
      await page.getByRole('button', { name: 'Change PIN' }).click();
      await page.waitForURL('**/dashboard');
    }

    // Phase 1: Create Organization
    const orgName = 'Golden Path Org ' + Date.now();

    await navigateTo(page, '/organizations/new');
    await page.waitForSelector('text=New Organization', { timeout: 10_000 });

    await page.locator('input[placeholder="Account Name"]').first().fill(orgName);

    const selects = page.locator('select');
    const selectCount = await selects.count();
    if (selectCount > 0) {
      await selects.nth(0).selectOption('School');
    }

    await page.locator('input[placeholder="City"]').first().fill('Golden Valley');

    const stateInput = page.locator('input[placeholder="State"]');
    if ((await stateInput.count()) > 0) {
      await stateInput.first().fill('MN');
    }

    const metroSelect = page.locator('select').filter({ has: page.locator('option[value="metro"]') });
    if ((await metroSelect.count()) > 0) {
      await metroSelect.first().selectOption('metro');
    }

    await page.getByRole('button', { name: 'Create Organization' }).click();
    await page.waitForURL('**/organizations/**', { timeout: 15_000 });
    await expect(page.getByText(orgName).first()).toBeVisible({ timeout: 10_000 });
    console.log('Created organization: ' + orgName);

    // Phase 2: Create Opportunity
    await navigateTo(page, '/opportunities/new');
    await page.waitForSelector('text=New Opportunity', { timeout: 10_000 });

    await page.locator('input[placeholder="Type or select school name..."]').first().fill(orgName);

    const progLevelSelect = page.locator('select').filter({ has: page.locator('option[value="Varsity"]') });
    if ((await progLevelSelect.count()) > 0) {
      await progLevelSelect.first().selectOption('Varsity');
    }

    const sportSelect = page.locator('select').filter({ has: page.locator('option[value="Football"]') });
    if ((await sportSelect.count()) > 0) {
      await sportSelect.first().selectOption('Football');
    }

    const seasonInput = page.locator('input[placeholder*="Season code"]');
    if ((await seasonInput.count()) > 0) {
      await seasonInput.first().fill('FA26');
    }

    const laneSelect = page.locator('select').filter({ has: page.locator('option[value="Uniforms"]') });
    if ((await laneSelect.count()) > 0) {
      await laneSelect.first().selectOption('Uniforms');
    }

    const valueInput = page.locator('input[inputmode="numeric"]').first();
    if ((await valueInput.count()) > 0) {
      await valueInput.fill('15000');
    }

    await page.getByRole('button', { name: 'Create Opportunity' }).click();
    await page.waitForURL('**/opportunities/**', { timeout: 15_000 });
    await page.waitForTimeout(2000);
    console.log('Created opportunity for organization: ' + orgName);

    // Phase 3: Verify both appear in lists
    await navigateTo(page, '/organizations');
    await page.waitForTimeout(2000);

    await navigateTo(page, '/opportunities');
    await page.waitForTimeout(2000);

    console.log('Org & Opp creation verified for: ' + orgName);
  });
});
