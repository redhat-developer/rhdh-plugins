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

import AxeBuilder from '@axe-core/playwright';
import { expect, Page, TestInfo } from '@playwright/test';

/**
 * Mapping of locale codes to their native display names
 */
const LOCALE_DISPLAY_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'Français',
  it: 'Italiano',
  ja: '日本語',
};

/**
 * Get the display name for a locale code
 */
export function getLocaleDisplayName(locale: string): string {
  const baseLocale = locale.split('-')[0];
  return LOCALE_DISPLAY_NAMES[baseLocale] || locale;
}

/**
 * Switch to a different locale in the application settings
 * @param page - Playwright page object
 * @param locale - The locale to switch to (e.g., 'en', 'fr', 'it', 'ja')
 */
export async function switchToLocale(
  page: Page,
  locale: string,
): Promise<void> {
  const baseLocale = locale.split('-')[0];
  if (baseLocale !== 'en') {
    const displayName = getLocaleDisplayName(locale);
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'English' }).click();
    await page.getByRole('option', { name: displayName }).click();
    await page.locator('a').filter({ hasText: 'Home' }).click();
    // Wait for page to settle after locale switch and reload
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Run accessibility tests using axe-core
 * @param page - Playwright page object
 * @param testInfo - Playwright test info for attaching results
 * @param attachName - Name of the attachment file
 */
export async function runAccessibilityTests(
  page: Page,
  testInfo: TestInfo,
  attachName = 'accessibility-scan-results.json',
) {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  await testInfo.attach(attachName, {
    body: JSON.stringify(accessibilityScanResults, null, 2),
    contentType: 'application/json',
  });
}
