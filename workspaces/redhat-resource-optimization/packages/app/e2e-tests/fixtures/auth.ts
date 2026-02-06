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

import { Page, expect } from '@playwright/test';

/**
 * Check if we're on a login page (Enter button visible).
 */
async function isOnLoginPage(page: Page): Promise<boolean> {
  const enterButton = page.getByRole('button', { name: 'Enter' });
  try {
    await expect(enterButton).toBeVisible({ timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Perform guest login by clicking the Enter button.
 * Works with real RHDH clusters configured for guest authentication.
 */
export async function performGuestLogin(page: Page) {
  const enterButton = page.getByRole('button', { name: 'Enter' });

  // Verify the login button is visible
  await expect(enterButton).toBeVisible({ timeout: 15000 });

  // Click the login button
  await enterButton.click();

  // Wait for page to load after login
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Verify we're no longer on the login page
  const stillOnLogin = await isOnLoginPage(page);
  if (stillOnLogin) {
    // Sometimes need to wait a bit more and try again
    await page.waitForTimeout(2000);
    const stillStuck = await isOnLoginPage(page);
    if (stillStuck) {
      throw new Error(
        'Guest login failed - still on login page after clicking Enter. ' +
          'Make sure guest authentication is enabled on the cluster.',
      );
    }
  }
}

/**
 * Check if user is already authenticated (no login button visible).
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // If we can see typical logged-in UI elements, we're authenticated
  // Otherwise check if login button is NOT visible
  const enterButton = page.getByRole('button', { name: 'Enter' });
  try {
    await expect(enterButton).not.toBeVisible({ timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure user is authenticated - perform guest login if needed.
 * This is the main function tests should use.
 */
export async function ensureAuthenticated(page: Page) {
  // Wait a moment for page to settle
  await page.waitForLoadState('domcontentloaded');

  // Check if already logged in
  const authenticated = await isAuthenticated(page);
  if (!authenticated) {
    await performGuestLogin(page);
  }
}
