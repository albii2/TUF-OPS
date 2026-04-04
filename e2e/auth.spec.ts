import { test, expect } from '@playwright/test';

test.describe('Authentication Smoke Test', () => {
  test('should allow a user to sign in and access the dashboard', async ({ page }) => {
    // Navigate to the sign-in page
    await page.goto('/auth/signin');

    // Fill in the credentials
    await page.fill('input[name="email"]', 'admin@tufops.com');
    await page.fill('input[name="password"]', 'admin123');

    // Click the sign-in button
    await page.click('button[type="submit"]');

    // Wait for navigation to the dashboard and verify the URL
    await page.waitForURL('/dashboard');
    expect(page.url()).toContain('/dashboard');

    // Verify the session by hitting the API endpoint
    const sessionResponse = await page.request.get('/api/auth/session');
    const sessionJson = await sessionResponse.json();

    // Assert that the session contains the logged-in user's email
    expect(sessionJson.user.email).toBe('admin@tufops.com');
    
    // Verify the dashboard page is accessible and renders correctly
    const dashboardTitle = await page.textContent('h1');
    expect(dashboardTitle).toContain('Dashboard');
  });
});
