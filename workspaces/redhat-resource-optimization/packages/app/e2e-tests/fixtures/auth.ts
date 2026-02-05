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
 * Setup all authentication mocks before any navigation happens.
 * This ensures mocks are in place before the auth flow starts.
 */
export async function setupAuthMocks(page: Page) {
  // Mock guest authentication start endpoint
  await page.route('**/api/auth/guest/start', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        url: '/api/auth/guest/refresh',
        method: 'POST',
      }),
    });
  });

  // Mock guest authentication refresh endpoint
  await page.route('**/api/auth/guest/refresh', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'mock-guest-token',
        expires_in: 3600,
      }),
    });
  });

  // Mock session endpoint
  await page.route('**/api/auth/session', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          type: 'user',
          userEntityRef: 'user:default/guest',
          ownershipEntityRefs: [],
        },
      }),
    });
  });

  // Mock user profile endpoint
  await page.route('**/api/auth/user', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        type: 'user',
        userEntityRef: 'user:default/guest',
        ownershipEntityRefs: [],
      }),
    });
  });

  // Mock identity endpoint
  await page.route('**/api/auth/identity', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        type: 'user',
        userEntityRef: 'user:default/guest',
        ownershipEntityRefs: [],
      }),
    });
  });

  // Mock permission endpoint
  await page.route('**/api/permission/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: 'ALLOW',
        conditions: [],
      }),
    });
  });
}

/**
 * Perform guest login by clicking the Enter button and waiting for authentication to complete.
 * This function verifies that login actually succeeded.
 */
export async function performGuestLogin(page: Page) {
  const enterButton = page.getByRole('button', { name: 'Enter' });

  // Verify the login button is visible
  await expect(enterButton).toBeVisible({ timeout: 10000 });

  // Click the login button
  await enterButton.click();

  // Wait for navigation away from login page OR error message
  try {
    // Try to wait for either:
    // 1. Button disappears (successful login and redirect)
    // 2. URL changes (successful login)
    // This is Playwright's waitFor, not React Testing Library
    // eslint-disable-next-line testing-library/await-async-utils
    const buttonHidden = enterButton.waitFor({
      state: 'hidden',
      timeout: 5000,
    });
    // eslint-disable-next-line testing-library/await-async-utils
    const urlChanged = page.waitForURL(
      url => !url.pathname.includes('/signin'),
      {
        timeout: 5000,
      },
    );
    await Promise.race([buttonHidden, urlChanged]);
  } catch {
    // If button is still visible after 5s, check for error message
    const errorMessage = page.getByText(/cannot sign in as a guest/i);
    const hasError = await errorMessage.isVisible().catch(() => false);

    if (hasError) {
      throw new Error(
        'Guest authentication is not properly configured. The auth mocks may not be working. ' +
          'Error: "You cannot sign in as a guest, you must either enable the legacy guest token ' +
          'or configure the auth backend to support guest sign in."',
      );
    }

    // If no error, authentication might have succeeded but UI didn't update
    // Continue and let subsequent checks verify
  }

  // Wait for network to settle
  await page.waitForLoadState('networkidle', { timeout: 15000 });
}

/**
 * Check if user is already authenticated (no login button visible).
 * Returns true if authenticated, false otherwise.
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const enterButton = page.getByRole('button', { name: 'Enter' });
  try {
    await expect(enterButton).not.toBeVisible({ timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure user is authenticated - perform login if needed.
 */
export async function ensureAuthenticated(page: Page) {
  const authenticated = await isAuthenticated(page);
  if (!authenticated) {
    await performGuestLogin(page);
  }
}
