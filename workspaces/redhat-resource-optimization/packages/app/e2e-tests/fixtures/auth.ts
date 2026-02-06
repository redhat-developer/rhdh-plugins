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
