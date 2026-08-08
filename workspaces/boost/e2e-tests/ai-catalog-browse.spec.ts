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

import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { runAccessibilityTests } from './utils/accessibility.js';
import { getTranslations, type BoostMessages } from './utils/translations.js';

test.describe.configure({ mode: 'serial' });

let page: Page;
let context: BrowserContext;
let t: BoostMessages;

// Total number of AI asset entities in fixtures/ai-catalog-fixtures.yaml
// (excludes Group entities used only as owners).
const FIXTURE_ASSET_COUNT = 7;

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext();
  page = await context.newPage();
  t = getTranslations();

  // Land on the app and authenticate as guest
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter' }).click();
});

test.afterAll(async () => {
  await context.close();
});

// -----------------------------------------------------------------------
// 1. Browse page loads with fixture card grid
// -----------------------------------------------------------------------
test('browse page loads with fixture card grid', async () => {
  await page.goto('/ai-catalog');

  // Page title is visible
  await expect(
    page.getByRole('heading', { name: t.catalog.page.title }),
  ).toBeVisible();

  // Toolbar shows the total count
  await expect(
    page.getByText(`${t.catalog.toolbar.allPrefix} (${FIXTURE_ASSET_COUNT})`),
  ).toBeVisible();

  // Cards are rendered in the grid
  const cards = page
    .locator('[class*="card"]')
    .filter({ has: page.locator('a') });
  await expect(cards.first()).toBeVisible();
});

// -----------------------------------------------------------------------
// 2. Search filters cards, URL updates with ?q=
// -----------------------------------------------------------------------
test('search filters cards and URL updates with q param', async () => {
  await page.goto('/ai-catalog');
  await expect(
    page.getByText(`${t.catalog.toolbar.allPrefix} (${FIXTURE_ASSET_COUNT})`),
  ).toBeVisible();

  // Type a search query that matches only one fixture entity
  const searchInput = page.getByPlaceholder(t.catalog.toolbar.search);
  await searchInput.fill('Code Review Skill');

  // Wait for filtered count
  await expect(
    page.getByText(`${t.catalog.toolbar.allPrefix} (1)`),
  ).toBeVisible();

  // URL should contain q parameter
  expect(page.url()).toContain('q=');
});

// -----------------------------------------------------------------------
// 3. Sidebar filter narrows results
// -----------------------------------------------------------------------
test('sidebar filter narrows results', async () => {
  await page.goto('/ai-catalog');
  await expect(
    page.getByText(`${t.catalog.toolbar.allPrefix} (${FIXTURE_ASSET_COUNT})`),
  ).toBeVisible();

  // Open the Type filter and select "Skill"
  const typeFilter = page.getByLabel(t.catalog.filter.type);
  await typeFilter.click();
  await page.getByRole('option', { name: 'Skill' }).click();

  // Close the dropdown by pressing Escape
  await page.keyboard.press('Escape');

  // Count should decrease — only code-review-skill is a skill
  await expect(
    page.getByText(`${t.catalog.toolbar.allPrefix} (1)`),
  ).toBeVisible();
});

// -----------------------------------------------------------------------
// 4. Multiple filters combine as AND
// -----------------------------------------------------------------------
test('multiple filters combine as AND', async () => {
  await page.goto('/ai-catalog');
  await expect(
    page.getByText(`${t.catalog.toolbar.allPrefix} (${FIXTURE_ASSET_COUNT})`),
  ).toBeVisible();

  // Select Owner = team-ai-platform (owns: code-review-skill, developer-assistant, docs-vector-store)
  const ownerFilter = page.getByLabel(t.catalog.filter.owner);
  await ownerFilter.click();
  await page.getByRole('option', { name: 'team-ai-platform' }).click();
  await page.keyboard.press('Escape');

  await expect(
    page.getByText(`${t.catalog.toolbar.allPrefix} (3)`),
  ).toBeVisible();

  // Now also select Type = Skill — should narrow to code-review-skill only
  const typeFilter = page.getByLabel(t.catalog.filter.type);
  await typeFilter.click();
  await page.getByRole('option', { name: 'Skill' }).click();
  await page.keyboard.press('Escape');

  await expect(
    page.getByText(`${t.catalog.toolbar.allPrefix} (1)`),
  ).toBeVisible();
});

// -----------------------------------------------------------------------
// 5. Clear filters restores full grid
// -----------------------------------------------------------------------
test('clear filters restores full grid', async () => {
  await page.goto('/ai-catalog');
  await expect(
    page.getByText(`${t.catalog.toolbar.allPrefix} (${FIXTURE_ASSET_COUNT})`),
  ).toBeVisible();

  // Apply a search to narrow results
  const searchInput = page.getByPlaceholder(t.catalog.toolbar.search);
  await searchInput.fill('nonexistent-query-that-matches-nothing');

  // Should show the empty filtered state
  await expect(page.getByText(t.catalog.emptyFiltered.title)).toBeVisible();

  // Click "Clear filters"
  await page
    .getByRole('button', { name: t.catalog.emptyFiltered.clearFilters })
    .click();

  // Full grid should be restored
  await expect(
    page.getByText(`${t.catalog.toolbar.allPrefix} (${FIXTURE_ASSET_COUNT})`),
  ).toBeVisible();
});

// -----------------------------------------------------------------------
// 6. Card click navigates to entity detail page
// -----------------------------------------------------------------------
test('card click navigates to entity detail page', async () => {
  await page.goto('/ai-catalog');
  await expect(
    page.getByText(`${t.catalog.toolbar.allPrefix} (${FIXTURE_ASSET_COUNT})`),
  ).toBeVisible();

  // Click the first card link — cards navigate to /catalog/<namespace>/<kind>/<name>
  const firstCardLink = page.locator('a[href*="/catalog/"]').first();
  await expect(firstCardLink).toBeVisible();
  const href = await firstCardLink.getAttribute('href');
  await firstCardLink.click();

  // Should navigate to the entity detail page
  await page.waitForURL('**/catalog/**');
  expect(page.url()).toContain('/catalog/');
  // The href we captured should match the current path
  expect(page.url()).toContain(href!);
});

// -----------------------------------------------------------------------
// 7. Empty state on impossible filter combo
// -----------------------------------------------------------------------
test('empty state on impossible filter combo', async () => {
  await page.goto('/ai-catalog');
  await expect(
    page.getByText(`${t.catalog.toolbar.allPrefix} (${FIXTURE_ASSET_COUNT})`),
  ).toBeVisible();

  // Search for something that won't match any fixture
  const searchInput = page.getByPlaceholder(t.catalog.toolbar.search);
  await searchInput.fill('zzz-impossible-filter-no-match');

  // The empty filtered state should appear
  await expect(page.getByText(t.catalog.emptyFiltered.title)).toBeVisible();
  await expect(
    page.getByText(t.catalog.emptyFiltered.description),
  ).toBeVisible();
});

// -----------------------------------------------------------------------
// 8. Pagination controls work
// -----------------------------------------------------------------------
test('pagination controls are present', async () => {
  await page.goto('/ai-catalog');
  await expect(
    page.getByText(`${t.catalog.toolbar.allPrefix} (${FIXTURE_ASSET_COUNT})`),
  ).toBeVisible();

  // Pagination component should be visible (it renders even with few items)
  // Look for the rows-per-page selector which is always present
  const pagination = page.locator(
    '[class*="pagination"], [class*="Pagination"]',
  );
  await expect(pagination.first()).toBeVisible();
});

// -----------------------------------------------------------------------
// 9. axe-core accessibility audit (unfiltered + filtered)
// -----------------------------------------------------------------------
test('accessibility audit on unfiltered browse page', async ({}, testInfo) => {
  await page.goto('/ai-catalog');
  await expect(
    page.getByText(`${t.catalog.toolbar.allPrefix} (${FIXTURE_ASSET_COUNT})`),
  ).toBeVisible();

  await runAccessibilityTests(page, testInfo, 'a11y-unfiltered.json');
});

test('accessibility audit on filtered browse page', async ({}, testInfo) => {
  await page.goto('/ai-catalog');
  await expect(
    page.getByText(`${t.catalog.toolbar.allPrefix} (${FIXTURE_ASSET_COUNT})`),
  ).toBeVisible();

  // Apply a search filter
  const searchInput = page.getByPlaceholder(t.catalog.toolbar.search);
  await searchInput.fill('granite');

  await expect(
    page.getByText(`${t.catalog.toolbar.allPrefix} (1)`),
  ).toBeVisible();

  await runAccessibilityTests(page, testInfo, 'a11y-filtered.json');
});
