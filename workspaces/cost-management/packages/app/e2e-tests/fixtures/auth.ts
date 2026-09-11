/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Page } from '@playwright/test';

/**
 * Perform guest login by navigating to the base URL and clicking Enter.
 * Follows the same pattern as flight-path-auto-tests Login utility:
 *   page.goto("/")
 *   page.locator('button:has-text("Enter")').click()
 */
export async function performGuestLogin(page: Page) {
  // Navigate to root first (login page)
  await page.goto('/');

  // Click the Enter button - simple pattern matching flight-path-auto-tests
  await page.locator('button:has-text("Enter")').click();

  // Wait for page to settle after login
  await page.waitForLoadState('networkidle', { timeout: 30000 });
}

/**
 * Perform OIDC login via Keycloak popup.
 * Matches the pattern from flight-path-auto-tests resourceOptimizationPages.ts.
 *
 * @param page - Playwright page
 * @param username - Keycloak username (defaults to OIDC_USERNAME env var)
 * @param password - Keycloak password (defaults to OIDC_PASSWORD env var or 'test')
 */
export async function performOIDCLogin(
  page: Page,
  username?: string,
  password?: string,
) {
  const user = username ?? process.env.OIDC_USERNAME ?? 'ro-read-no-workflow';
  const pass = password ?? process.env.OIDC_PASSWORD ?? 'test';

  // Navigate to root (login page)
  await page.goto('/');

  // Click the OIDC Sign In button and handle the Keycloak popup
  const popupPromise = page.waitForEvent('popup');
  await page.locator('button:has-text("Sign in")').click();
  const popup = await popupPromise;

  // Fill in Keycloak credentials
  await popup.getByLabel('Username or email').fill(user);
  await popup.getByLabel('Password').fill(pass);
  await popup.getByRole('button', { name: 'Sign in' }).click();

  // Wait for the popup to close
  await popup.waitForEvent('close', { timeout: 30000 }).catch(() => {
    // Popup may already be closed
  });

  // Wait for the sidebar to appear — reliable indicator that login completed
  // Wait for the nav bar to appear — indicates login completed
  await page
    .locator('nav')
    .first()
    .waitFor({ state: 'visible', timeout: 30000 });
}

/**
 * Auto-detect and perform the appropriate login method.
 * Tries guest login first (Enter button), falls back to OIDC popup.
 *
 * @param page - Playwright page
 * @param username - Optional OIDC username (defaults to OIDC_USERNAME env var)
 * @param password - Optional OIDC password (defaults to OIDC_PASSWORD env var)
 */
export async function performLogin(
  page: Page,
  username?: string,
  password?: string,
) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const enterButton = page.locator('button:has-text("Enter")');
  const hasEnter = await enterButton
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (hasEnter) {
    await enterButton.click();
    await page.waitForLoadState('networkidle', { timeout: 30000 });
  } else {
    // OIDC login — we're already on the login page, no need to navigate again
    const user = username ?? process.env.OIDC_USERNAME ?? 'ro-read-no-workflow';
    const pass = password ?? process.env.OIDC_PASSWORD ?? 'test';

    const popupPromise = page.waitForEvent('popup');
    await page.locator('button:has-text("Sign in")').click();
    const popup = await popupPromise;

    await popup.getByLabel('Username or email').fill(user);
    await popup.getByLabel('Password').fill(pass);
    await popup.getByRole('button', { name: 'Sign in' }).click();

    await popup.waitForEvent('close', { timeout: 30000 }).catch(() => {});
    // Wait for the nav bar to appear — indicates login completed
    await page
      .locator('nav')
      .first()
      .waitFor({ state: 'visible', timeout: 30000 });
  }
}

/**
 * Sign out the current user from RHDH.
 * Opens the user menu and clicks Sign Out.
 */
export async function signOut(page: Page) {
  // Click the user settings/profile button to open the menu
  const settingsButton = page.locator(
    '[data-testid="header-world-readable-avatar"], [aria-label="User settings"]',
  );

  try {
    await settingsButton.first().click({ timeout: 5000 });
    await page.waitForTimeout(500);

    const signOutItem = page.locator('a, button, [role="menuitem"]', {
      hasText: 'Sign out',
    });
    await signOutItem.first().click({ timeout: 5000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  } catch {
    // Sign out link may not be visible; navigate to root to reset
    await page.goto('/');
  }
}

/**
 * Ensure user is authenticated - perform guest login if needed.
 * This is the main function tests should use.
 */
export async function ensureAuthenticated(page: Page) {
  // Wait for the page to finish loading
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // Check if Enter button exists on the page (login screen)
  const enterButton = page.locator('button:has-text("Enter")');
  const count = await enterButton.count();

  if (count > 0 && (await enterButton.first().isVisible())) {
    // We're on the login page - click Enter
    await enterButton.first().click();
    // Wait for navigation away from login
    await page.waitForLoadState('networkidle', { timeout: 30000 });
  }
}

/**
 * Stub for setupAuthMocks - only needed for local dev mode.
 * In live cluster testing, this is a no-op.
 */
export async function setupAuthMocks(_page: Page) {
  // No-op for live cluster testing.
  // Auth mocks are only needed when testing against local dev server.
}
