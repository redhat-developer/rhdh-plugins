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
export function getPanel(page: Page, panelTitle: string) {
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
export async function closeDateRangePicker(page: Page, cancelText?: string) {
  const datePicker = page.locator('.v5-MuiPaper-root', {
    hasText: 'Start date',
  });
  await datePicker
    .getByRole('button', { name: cancelText || 'Cancel' })
    .click();
}

/**
 * Visit a catalog entity by name
 */
export async function visitCatalogEntity(page: Page, entityName: string) {
  await navigate(page, 'home');
  await page.getByRole('link', { name: entityName }).click();
  await page
    .getByRole('heading', { name: entityName })
    .waitFor({ state: 'visible' });
}

/**
 * Run a template with the given parameters
 */
export async function runTemplate(
  page: Page,
  runName: string,
  org: string,
  repo: string,
) {
  await navigate(page, 'create...');
  await page.getByTestId('template-card-actions--create').click();
  await page.getByRole('textbox').fill(runName);
  await page.getByRole('button', { name: 'next' }).click();
  await page.getByRole('textbox').first().fill(org);
  await page.getByRole('textbox').last().fill(repo);
  await page.getByRole('button', { name: 'review' }).click();
  await page.getByRole('button', { name: 'create' }).click();
  await page
    .getByText('Run of Example Node.js Template')
    .waitFor({ state: 'visible' });
}

/**
 * Visit the docs page
 */
export async function visitDocs(page: Page) {
  await navigate(page, 'docs');
  await page.getByText('No documents to show').waitFor({ state: 'visible' });
}

/**
 * Perform a search query
 */
export async function performSearch(page: Page, searchQuery: string) {
  await page.getByRole('button', { name: 'search' }).click();
  await page.getByRole('textbox').fill(searchQuery);

  const noSearchResults = page.getByRole('heading', {
    name: 'Sorry, no results were found',
  });
  await noSearchResults.waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'close' }).click();
}

/**
 * Switch to a different locale
 */
export async function switchToLocale(
  page: Page,
  locale: string,
): Promise<void> {
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'English' }).click();
  await page.getByRole('option', { name: locale }).click();
  await page.locator('a').filter({ hasText: 'Home' }).click();
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
