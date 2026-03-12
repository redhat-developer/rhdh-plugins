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

export async function performGuestLogin(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

  const enterButton = page.locator('button:has-text("Enter")');
  await enterButton.waitFor({ state: 'visible', timeout: 15000 });
  await enterButton.click();

  await page
    .locator('nav')
    .first()
    .waitFor({ state: 'visible', timeout: 60000 });
}

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
    await page
      .locator('nav')
      .first()
      .waitFor({ state: 'visible', timeout: 30000 });
  } else {
    const user = username ?? process.env.OIDC_USERNAME ?? 'guest';
    const pass = password ?? process.env.OIDC_PASSWORD ?? 'test';

    const popupPromise = page.waitForEvent('popup');
    await page.locator('button:has-text("Sign in")').click();
    const popup = await popupPromise;

    await popup.getByLabel('Username or email').fill(user);
    await popup.getByLabel('Password').fill(pass);
    await popup.getByRole('button', { name: 'Sign in' }).click();

    await popup.waitForEvent('close', { timeout: 30000 }).catch(() => {});
    await page
      .locator('nav')
      .first()
      .waitFor({ state: 'visible', timeout: 30000 });
  }
}
