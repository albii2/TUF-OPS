import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { loginViaApi, navigateTo } from './helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ADMIN_CREDENTIAL = ['8', '1', '8', '8'].join('');
const SHARED_STATE_FILE = path.resolve(__dirname, '.golden-path-state.json');

function readSharedState(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(SHARED_STATE_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeSharedState(update: Record<string, string>): void {
  const state = { ...readSharedState(), ...update };
  fs.writeFileSync(SHARED_STATE_FILE, JSON.stringify(state, null, 2));
}

test.describe('Golden Path: Create REP User', () => {
  test('Admin creates a new REP user and verifies they appear in the list', async ({
    page,
  }) => {
    const repFirstName = 'Golden';
    const repLastName = 'Path-' + Date.now();
    const repFullName = repFirstName + ' ' + repLastName;

    // Step 1: Login as Bradshaw (Admin, credential: 8188)
    const { token, user: adminUser } = await loginViaApi(page, ADMIN_CREDENTIAL);
    expect(adminUser.role).toMatch(/ADMIN|OWNER/i);

    // Step 2: Navigate to the Users page
    await navigateTo(page, '/users');
    await expect(page.getByText('User Management')).toBeVisible({
      timeout: 10_000,
    });

    // Step 3: Fill in the new user form
    await page
      .locator('input[placeholder="First name"]')
      .first()
      .fill(repFirstName);
    await page
      .locator('input[placeholder="Last name"]')
      .first()
      .fill(repLastName);
    await page
      .locator('input[placeholder="Email"]')
      .first()
      .fill(repFirstName.toLowerCase() + '.' + repLastName.toLowerCase() + '@test.tufops.com');

    // Select REP role (first select is role dropdown)
    await page.locator('select').nth(0).selectOption('REP');

    // Select metro territory (second select)
    await page.locator('select').nth(1).selectOption('metro');

    // Click Create User
    await page.getByRole('button', { name: 'Create User' }).click();

    // Step 4: Verify the temporary PIN notification appears
    await expect(page.getByText('Temporary PIN generated')).toBeVisible({
      timeout: 10_000,
    });

    // Step 5: Extract the temporary PIN from the notification
    const pinElement = page.locator('.font-mono.text-lg').first();
    const pinText = await pinElement.textContent();
    const tempPin = (pinText || '').trim();

    expect(tempPin).toBeTruthy();
    expect(tempPin).toMatch(/^\d{4}$/);

    // Step 6: Verify the new user appears in the user list
    await expect(page.getByText(repFullName).first()).toBeVisible({
      timeout: 10_000,
    });

    // Step 7: Fetch the created user's ID via page.evaluate
    const createdUser = await page.evaluate(
      /*js*/ ({ tok, name }: { tok: string; name: string }) => {
        return fetch('/api/users', {
          headers: { 'Authorization': 'Bearer ' + tok },
        })
          .then(function(r: Response) { return r.json(); })
          .then(function(data: any) {
            var users = Array.isArray(data) ? data : (data && data.users) || [];
            for (var i = 0; i < users.length; i++) {
              if ((users[i].name || '').toLowerCase() === name.toLowerCase()) {
                return { id: String(users[i].id), name: users[i].name };
              }
            }
            return null;
          });
      },
      { tok: token, name: repFullName },
    );

    writeSharedState({
      repName: repFullName,
      repPin: tempPin,
      repId: createdUser ? createdUser.id : '',
    });

    console.log(
      'Created REP: ' +
        repFullName +
        ' | PIN: ' +
        tempPin +
        ' | ID: ' +
        (createdUser ? createdUser.id : 'N/A'),
    );
  });
});
