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

export const loginAsGuest = async (page: Page) => {
  // Wait for the login page to be ready
  await page
    .getByRole('button', { name: 'Enter' })
    .waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Enter' }).click();
  await page
    .getByRole('heading', { name: 'Red Hat Catalog' })
    .waitFor({ state: 'visible', timeout: 5000 });
};

export const keycloakLogin = async (
  user: string,
  password: string,
  page: Page,
) => {
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Sign In' }).click();
  const popup = await popupPromise;

  await popup.locator('#username').fill(user);
  await popup.locator('#password').fill(password);
  await popup.getByRole('button', { name: 'Sign In' }).click();
};

export const login = async (page: Page, user?: string, password?: string) => {
  if (user && password) {
    return keycloakLogin(user, password, page);
  }
  return loginAsGuest(page);
};
