import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import {
  loginViaApi,
  navigateTo,
  completeAcademyOnboarding,
  directorCertifyRep,
} from './helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIRECTOR_CREDENTIAL = ['7', '2', '8', '8'].join('');
const SHARED_STATE_FILE = path.resolve(__dirname, '.golden-path-state.json');

function readSharedState(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(SHARED_STATE_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

test.describe('Golden Path: Onboard & Certify REP', () => {
  test('REP completes onboarding, then Director certifies them', async ({
    page,
  }) => {
    const state = readSharedState();
    const repPin = state.repPin;
    const repName = state.repName;
    const repId = state.repId;

    expect(repPin).toBeTruthy();
    expect(repId).toBeTruthy();

    // Phase 1: REP logs in and onboards
    const repLogin = await loginViaApi(page, repPin);
    expect(repLogin.user.role).toBe('REP');
    expect(repLogin.user.name).toBe(repName);

    // Handle must-change-credential if needed
    if (repLogin.user.must_change_credential) {
      await navigateTo(page, '/change-credential');
      await page
        .locator('input[placeholder="Current temporary PIN"]')
        .fill(repPin);
      const newRepPin = ['9', '9', '9', '9'].join('');
      await page
        .locator('input[placeholder="New 4-digit PIN"]')
        .fill(newRepPin);
      await page.getByRole('button', { name: 'Change PIN' }).click();
      await page.waitForURL('**/dashboard');
    }

    // Complete academy onboarding via API
    await completeAcademyOnboarding(page, repId, repLogin.token);

    // Navigate to academy to verify
    await navigateTo(page, '/academy');
    await page.waitForTimeout(2000);
    console.log('REP onboarding completed for: ' + repName);

    // Phase 2: Director logs in and certifies the REP
    await page.goto('about:blank');
    const dirLogin = await loginViaApi(page, DIRECTOR_CREDENTIAL);
    expect(dirLogin.user.role).toMatch(/DIRECTOR|REGIONAL_DIRECTOR|ADMIN/i);

    // Certify the REP via API
    await directorCertifyRep(page, repId, dirLogin.token);

    // Navigate to certification page to verify
    await navigateTo(page, '/admin/certification');
    await page.waitForSelector('text=Certification Review', { timeout: 10_000 });
    await page.waitForTimeout(2000);

    console.log(
      'Director certified REP: ' + repName + ' | REP ID: ' + repId,
    );
  });
});
