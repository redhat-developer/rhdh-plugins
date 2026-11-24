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
 * Profile trigger accessible name is `{displayName}, {Settings}` (WCAG 2.5.3).
 * Match either that or a plain Settings label.
 */
function profileSettingsButton(page: Page) {
  return page.getByRole('button', { name: /Settings/i });
}

/**
 * Sign in as guest and wait until the authenticated shell is ready.
 * NFS cold starts can be slow when several locale workers log in together.
 *
 * With the global header present, sidebar Settings is hidden by default — do
 * not wait for that link. Ready means the header (or profile menu) is up.
 */
export async function loginAsGuest(page: Page): Promise<void> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const enter = page.getByRole('button', { name: 'Enter' });
    await enter.click();

    try {
      await enter.waitFor({ state: 'hidden', timeout: 15_000 });
      // Sidebar Settings is hidden when GH is mounted — wait for header/profile.
      await page
        .locator('#global-header')
        .or(profileSettingsButton(page))
        .first()
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
 * Open user settings. Sidebar Settings is hidden when the global header is
 * present — use the profile dropdown (Guest → Settings) instead.
 */
async function openUserSettings(page: Page): Promise<void> {
  const sidebarSettings = page.getByRole('link', { name: 'Settings' });
  if (await sidebarSettings.isVisible()) {
    await sidebarSettings.click();
    return;
  }

  await profileSettingsButton(page).click();
  await page.getByRole('menuitem', { name: 'Settings' }).click();
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
