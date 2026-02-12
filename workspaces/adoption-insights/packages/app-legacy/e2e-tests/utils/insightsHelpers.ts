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
function getLocaleDisplayName(locale: string): string {
  const baseLocale = locale.split('-')[0];
  return LOCALE_DISPLAY_NAMES[baseLocale] || locale;
}

/**
 * Navigate to a page using the navigation link text
 */
export async function navigate(page: Page, link: string) {
  const navLink = page.locator(`nav a:has-text("${link}")`).first();
  await navLink.waitFor({ state: 'visible' });
  await navLink.click();
}

/**
 * Navigate to the Adoption Insights page
 */
export async function navigateToInsights(page: Page, insightsTitle?: string) {
  await navigate(page, insightsTitle || 'Adoption Insights');
}

/**
 * Get a panel locator by its title
 */
export function getPanel(page: Page, panelTitle: string | RegExp) {
  return page.locator('.v5-MuiPaper-root', { hasText: panelTitle });
}

/**
 * Select a date range option
 */
export async function selectDateRange(page: Page, option: string) {
  await page.getByRole('option', { name: option }).click();
}

/**
 * Open the date range picker
 */
export async function openDateRangePicker(page: Page, dateRangeText?: string) {
  const dateRange = page.getByRole('option', {
    name: dateRangeText || 'Date range...',
  });
  await dateRange.waitFor({ state: 'visible' });
  await dateRange.click();
}

/**
 * Close the date range picker
 */
export async function closeDateRangePicker(
  page: Page,
  cancelText?: string,
  startDateText?: string,
) {
  const datePicker = page.locator('.v5-MuiPaper-root', {
    hasText: startDateText || 'Start date',
  });
  await datePicker
    .getByRole('button', { name: cancelText || 'Cancel' })
    .click();
}

/**
 * Switch to a different locale
 */
export async function switchToLocale(
  page: Page,
  locale: string,
): Promise<void> {
  const baseLocale = locale.split('-')[0];
  if (baseLocale !== 'en') {
    const displayName = getLocaleDisplayName(locale);
    // Wait for the Settings link to be visible before clicking
    const settingsLink = page.getByRole('link', { name: 'Settings' });
    await settingsLink.waitFor({ state: 'visible', timeout: 10000 });
    await settingsLink.click();
    await page.getByRole('button', { name: 'English' }).click();
    await page.getByRole('option', { name: displayName }).click();
    await page.locator('a').filter({ hasText: 'Home' }).click();
  }
}

/**
 * Wait for data flush interval
 */
export async function waitForDataFlush() {
  await new Promise(res => setTimeout(res, 8000));
}

/**
 * Verify table entries in a panel
 * @param panel - The panel locator
 * @param expectedCount - Expected number of entries (default: 1)
 * @param expectedText - Optional text that should be contained in the entries
 */
export async function verifyTableEntries(
  panel: ReturnType<typeof getPanel>,
  expectedCount: number = 1,
  expectedText?: string,
) {
  const entries = panel.locator('tbody').locator('tr');
  await expect(entries).toHaveCount(expectedCount);
  if (expectedText) {
    await expect(entries).toContainText(expectedText);
  }
}

/**
 * Verify that a panel contains all the specified texts
 * @param panel - The panel locator
 * @param texts - Array of text strings that should be contained in the panel
 */
export async function verifyPanelContainsTexts(
  panel: ReturnType<typeof getPanel>,
  texts: string[],
) {
  for (const text of texts) {
    await expect(panel).toContainText(text);
  }
}
