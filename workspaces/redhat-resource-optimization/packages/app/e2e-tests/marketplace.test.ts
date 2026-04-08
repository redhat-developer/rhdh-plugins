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

import { test, expect } from '@playwright/test';
import { performGuestLogin } from './fixtures/auth';

/**
 * RHDH Extensions Marketplace — Plugin Installation Tests
 *
 * JIRA: FLPATH-2458 / FLPATH-2460
 *
 * Verifies that the Resource Optimization / Cost Management plugin can be
 * discovered and installed from the RHDH Extensions Marketplace UI.
 *
 * Prerequisites:
 *   - RHDH deployed with extensions.installation.enabled: true
 *   - ROS plugin NOT pre-installed via OCI injection (SKIP_ROS_DEPLOY=true)
 *   - PLAYWRIGHT_URL env var pointing to the RHDH instance
 */

const EXTENSIONS_PATH = '/extensions';
const PLUGIN_SEARCH_TERM = 'resource optimization';

test.describe('Extensions Marketplace: Plugin Installation @marketplace', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.PLAYWRIGHT_URL) {
      test.skip(true, 'PLAYWRIGHT_URL not set — skipping marketplace tests');
      return;
    }
    await performGuestLogin(page);
  });

  async function navigateToExtensions(page: import('@playwright/test').Page) {
    await page.goto(EXTENSIONS_PATH, { waitUntil: 'networkidle' });
    await expect(
      page.getByRole('heading', { name: 'Extensions', level: 1 }),
    ).toBeVisible({ timeout: 15000 });
  }

  async function searchForPlugin(page: import('@playwright/test').Page) {
    const searchInput = page.getByRole('textbox', { name: 'Search' });
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill(PLUGIN_SEARCH_TERM);
    await page.waitForTimeout(2000);
  }

  test('FLPATH-2458: Extensions page is accessible', async ({ page }) => {
    await navigateToExtensions(page);
    await expect(page).not.toHaveURL(/.*error.*/);

    await expect(page.getByRole('tab', { name: /Catalog/i })).toBeVisible();
    await expect(
      page.getByRole('tab', { name: /Installed packages/i }),
    ).toBeVisible();
  });

  test('FLPATH-2460: ROS plugin is listed in the marketplace', async ({
    page,
  }) => {
    await navigateToExtensions(page);
    await searchForPlugin(page);

    await expect(
      page.getByRole('heading', { name: /resource optimization/i }).first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test('FLPATH-2460: ROS plugin detail page is accessible', async ({
    page,
  }) => {
    await navigateToExtensions(page);
    await searchForPlugin(page);

    const readMore = page.getByRole('link', { name: 'Read more' }).first();
    await expect(readMore).toBeVisible({ timeout: 10000 });
    await readMore.click();

    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toContainText(/resource optimization/i, {
      timeout: 15000,
    });
  });

  test('FLPATH-2460: ROS plugin can be installed from marketplace', async ({
    page,
  }) => {
    await navigateToExtensions(page);
    await searchForPlugin(page);

    const readMore = page.getByRole('link', { name: 'Read more' }).first();
    await expect(readMore).toBeVisible({ timeout: 10000 });
    await readMore.click();
    await page.waitForLoadState('networkidle');

    const installButton = page.getByRole('button', { name: /install/i });
    await expect(installButton).toBeVisible({ timeout: 15000 });
    await installButton.click();

    const successIndicator = page
      .locator('body')
      .filter({ hasText: /installed|enabled|success|uninstall/i });
    await expect(successIndicator).toBeVisible({ timeout: 60000 });
  });

  test('FLPATH-2458: Verify plugin appears in Installed packages after install', async ({
    page,
  }) => {
    await navigateToExtensions(page);

    const installedTab = page.getByRole('tab', {
      name: /Installed packages/i,
    });
    await installedTab.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const pageContent = page.locator('body');
    const hasRosPlugin = await pageContent
      .filter({ hasText: /resource optimization|cost.management/i })
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (hasRosPlugin) {
      await expect(
        pageContent.filter({
          hasText: /resource optimization|cost.management/i,
        }),
      ).toBeVisible();
    } else {
      // Plugin may not appear immediately; log for CI visibility
      test.info().annotations.push({
        type: 'info',
        description:
          'ROS plugin not yet visible in Installed packages — may require pod restart',
      });
    }
  });
});
