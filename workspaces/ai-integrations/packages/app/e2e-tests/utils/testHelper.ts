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

import { expect, Page } from '@playwright/test';

const LOCALE_DISPLAY_NAMES: Record<string, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  ja: '日本語',
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

export function getLocaleDisplayName(locale: string): string {
  const baseLocale = locale.split('-')[0];
  return LOCALE_DISPLAY_NAMES[baseLocale] || locale;
}

export async function signInAsGuest(page: Page) {
  await page.goto('/');
  const enterButton = page.getByRole('button', { name: 'Enter' });
  await expect(enterButton).toBeVisible();
  await enterButton.click();
  await expect(page).toHaveURL(/\/home/);
}

export async function gotoAiResourceCatalog(page: Page) {
  await page.goto('/catalog?filters[kind]=airesource&filters[user]=all');
}

export async function switchToLocale(
  page: Page,
  locale: string,
): Promise<void> {
  const baseLocale = locale.split('-')[0];
  if (baseLocale === 'en') {
    return;
  }

  const displayName = getLocaleDisplayName(locale);
  const localeDisplayPattern = new RegExp(
    `^(${Object.values(LOCALE_DISPLAY_NAMES).map(escapeRegExp).join('|')})$`,
  );

  await page.goto('/settings');
  await page.waitForURL('**/settings**', { timeout: 60_000 });
  const languageButton = page
    .getByRole('button', { name: localeDisplayPattern })
    .first();
  await expect(languageButton).toBeVisible({ timeout: 60_000 });

  if ((await languageButton.textContent())?.trim() === displayName) {
    return;
  }

  await languageButton.click();
  await page.getByRole('option', { name: displayName }).click();
  await expect(languageButton).toHaveText(displayName, { timeout: 15_000 });
}

export async function expectAboutCardField(
  page: Page,
  label: string,
  value: string,
) {
  const field = page
    .getByRole('heading', { name: label, exact: true })
    .locator('..');
  await expect(field).toContainText(value);
}
