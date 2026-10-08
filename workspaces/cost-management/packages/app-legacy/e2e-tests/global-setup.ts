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

import { chromium } from '@playwright/test';

/**
 * Playwright globalSetup — runs once before all workers are spawned.
 *
 * When running against a live cluster and ROS_DYNAMIC_PLUGINS_VERSION is not
 * already set, this launches a headless browser, logs in, and checks whether
 * the sidebar contains "Cost management" (1.3.x+) or falls back to the flat
 * "Optimizations" label (1.2.x legacy).
 *
 * The detected version is written to process.env so that routes.ts and the
 * test skip-guards in every spec file pick it up correctly.
 */
async function globalSetup() {
  const baseUrl = process.env.PLAYWRIGHT_URL;
  if (!baseUrl || process.env.ROS_DYNAMIC_PLUGINS_VERSION) {
    return;
  }

  // eslint-disable-next-line no-console
  console.log('[global-setup] Detecting ROS plugin version via sidebar probe…');

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');

    // Handle login — try guest "Enter" first, fall back to OIDC.
    const enterButton = page.locator('button:has-text("Enter")');
    const hasEnter = await enterButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasEnter) {
      await enterButton.click();
    } else {
      const user = process.env.OIDC_USERNAME ?? 'ro-read-no-workflow';
      const pass = process.env.OIDC_PASSWORD ?? 'test';

      // Listen for a popup but attach .catch() immediately so that if
      // the promise rejects while we are still awaiting the click(),
      // Node.js does not treat it as an unhandled rejection and crash
      // the process.  The resolved value will be null when no popup
      // appears (redirect-based OIDC flow).
      const popupPromise = page
        .waitForEvent('popup', { timeout: 15_000 })
        .catch(() => null);

      // noWaitAfter: don't let Playwright wait for a potential
      // navigation — we handle both popup and redirect flows below.
      await page
        .locator('button:has-text("Sign in")')
        .click({ noWaitAfter: true });

      const popup = await popupPromise;

      if (popup) {
        // Popup-based OIDC flow (Keycloak opens in a new window).
        await popup.getByLabel('Username or email').fill(user);
        await popup.getByLabel('Password').fill(pass);
        await popup.getByRole('button', { name: 'Sign in' }).click();
        await popup.waitForEvent('close', { timeout: 30_000 }).catch(() => {});
      } else {
        // Redirect-based OIDC flow — Keycloak loaded in the same tab.
        const usernameField = page.getByLabel('Username or email');
        const hasUsernameField = await usernameField
          .isVisible({ timeout: 10_000 })
          .catch(() => false);
        if (hasUsernameField) {
          await usernameField.fill(user);
          await page.getByLabel('Password').fill(pass);
          await page.getByRole('button', { name: 'Sign in' }).click();
        }
        // If neither popup nor redirect produced a login form, the
        // version probe will fail on the nav check below and fall
        // through to the catch block harmlessly.
      }
    }

    // Wait for the nav sidebar to appear after login.
    await page
      .locator('nav')
      .first()
      .waitFor({ state: 'visible', timeout: 30000 });

    // Check for the "Cost management" collapsible group (1.3.x+ sidebar).
    const hasCostMgmt = await page
      .getByRole('button', { name: /^cost management$/i })
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!hasCostMgmt) {
      process.env.ROS_DYNAMIC_PLUGINS_VERSION = '1.2.0-detected';
      // eslint-disable-next-line no-console
      console.log(
        '[global-setup] No "Cost management" sidebar group → legacy ROS 1.2.x detected',
      );
    } else {
      // eslint-disable-next-line no-console
      console.log(
        '[global-setup] "Cost management" sidebar group found → 1.3.x+',
      );
    }

    await context.close();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(`[global-setup] Browser probe failed: ${err}`);
  } finally {
    await browser.close();
  }
}

export default globalSetup;
