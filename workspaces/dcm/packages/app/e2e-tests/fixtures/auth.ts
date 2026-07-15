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
import { TIMEOUTS } from '../utils/constants';

/**
 * Authenticate with a deployed RHDH instance.
 *
 * Detects the auth mode automatically:
 *  - Guest auth: clicks the "Enter" button on the login page.
 *  - OIDC (Keycloak): clicks "Sign in", fills the Keycloak form in the popup.
 *
 * For OIDC, credentials come from OIDC_USERNAME / OIDC_PASSWORD env vars
 * (defaults: "guest" / "guest").
 */
export async function performLogin(page: Page) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded', {
        timeout: TIMEOUTS.page,
      });

      const nav = page.locator('nav').first();
      const enterButton = page.locator('button:has-text("Enter")');
      const signInButton = page.locator('button:has-text("Sign in")');

      const which = await Promise.race([
        enterButton
          .waitFor({ state: 'visible', timeout: TIMEOUTS.table })
          .then(() => 'guest' as const),
        signInButton
          .waitFor({ state: 'visible', timeout: TIMEOUTS.table })
          .then(() => 'oidc' as const),
        nav
          .waitFor({ state: 'visible', timeout: TIMEOUTS.table })
          .then(() => 'already-logged-in' as const),
      ]);

      if (which === 'already-logged-in') return;

      if (which === 'guest') {
        await enterButton.click();
      } else {
        const username = process.env.OIDC_USERNAME ?? 'guest';
        const password = process.env.OIDC_PASSWORD ?? 'guest';

        const popupPromise = page.waitForEvent('popup');
        await signInButton.click();
        const popup = await popupPromise;
        await popup.waitForLoadState('domcontentloaded', {
          timeout: TIMEOUTS.page,
        });
        await popup.getByLabel('Username or email').fill(username);
        await popup.getByLabel('Password').fill(password);
        await popup.getByRole('button', { name: 'Sign in' }).click();
      }

      await nav.waitFor({ state: 'visible', timeout: TIMEOUTS.page });
      return;
    } catch (err) {
      if (attempt === 1) throw err;
      await page.waitForTimeout(2_000);
    }
  }
}

/** @deprecated Use {@link performLogin} which handles both guest and OIDC. */
export const performGuestLogin = performLogin;
