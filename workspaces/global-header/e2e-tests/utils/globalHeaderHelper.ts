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

import type { GlobalHeaderMessages } from './translations';

/**
 * Mapping of locale codes to their native display names
 */
const LOCALE_DISPLAY_NAMES: Record<string, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  ja: '日本語',
};

/**
 * Get the display name for a locale code
 */
function getLocaleDisplayName(locale: string): string {
  const baseLocale = locale.split('-')[0];
  return LOCALE_DISPLAY_NAMES[baseLocale] || locale;
}

/**
 * Sign in as guest and wait until the authenticated shell is ready.
 * NFS cold starts can be slow when several locale workers log in together.
 */
export async function loginAsGuest(page: Page): Promise<void> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const enter = page.getByRole('button', { name: 'Enter' });
    await enter.click();

    try {
      await enter.waitFor({ state: 'hidden', timeout: 15_000 });
      await page
        .getByRole('link', { name: 'Settings' })
        .waitFor({ state: 'visible', timeout: 15_000 });

      return;
    } catch {
      if (attempt === maxAttempts) {
        throw new Error('loginAsGuest failed');
      }
      await page.reload();
    }
  }
}

/**
 * Open user settings. NFS exposes a sidebar Settings link; legacy uses the
 * profile dropdown (Guest → Settings) because its sidebar has no settings nav.
 */
async function openUserSettings(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'Settings' }).click();
}

/**
 * Switch to a different locale
 * Extracts base language code (e.g., "en" from "en-US") for locale selection
 */
export async function switchToLocale(
  page: Page,
  locale: string,
): Promise<void> {
  const baseLocale = locale.split('-')[0];
  if (baseLocale === 'en') {
    return;
  }

  const displayName = getLocaleDisplayName(locale);

  await openUserSettings(page);
  await page.getByRole('button', { name: 'English' }).click();
  await page.getByRole('option', { name: displayName }).click();
  await page.goto('/');
}

/**
 * Wait until the global header shell and lazy-loaded toolbar items are ready.
 * Search and Help both come from the critical header async chunk.
 */
export async function waitForHeaderReady(
  page: Page,
  messages: GlobalHeaderMessages,
): Promise<void> {
  const globalHeader = page.locator('#global-header');
  await expect(globalHeader).toBeVisible();
  await expect(
    globalHeader.getByRole('combobox', { name: messages.search.placeholder }),
  ).toBeVisible();
  await expect(
    globalHeader.getByRole('button', { name: messages.help.tooltip }),
  ).toBeVisible();
}
