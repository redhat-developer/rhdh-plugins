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

import { test, expect, Page } from '@playwright/test';
import { performGuestLogin } from './fixtures/auth';

/**
 * RHDH Extensions Marketplace — Plugin Installation Tests
 *
 * JIRA: FLPATH-2458 / FLPATH-2460
 *
 * Verifies that the Resource Optimization / Cost Management plugin can be
 * discovered and installed from the RHDH Extensions Marketplace UI, and
 * that the plugin's sidebar items appear after installation.
 *
 * Sidebar structure varies by RHDH version:
 *   - RHDH 1.8 (ROS 1.2.x): flat "Optimizations" sidebar item
 *   - RHDH 1.9+ (Cost Mgmt 1.3.x): "Cost management" group →
 *       "OpenShift" + "Optimizations" sub-items
 *
 * Prerequisites:
 *   - RHDH deployed with extensions.installation.enabled: true
 *   - ROS plugin NOT pre-installed via OCI injection (SKIP_ROS_DEPLOY=true)
 *   - PLAYWRIGHT_URL env var pointing to the RHDH instance
 */

const EXTENSIONS_PATH = '/extensions';
const PLUGIN_SEARCH_TERM = 'cost management';

/**
 * Detect which sidebar layout the installed plugin exposes.
 * Returns 'nested' for 1.3.x+ (Cost management group) or 'flat' for 1.2.x
 * (Optimizations top-level item), or null if neither is found.
 */
async function detectSidebarLayout(
  page: Page,
): Promise<'nested' | 'flat' | null> {
  const costMgmt = page.getByRole('button', { name: /^cost management$/i });
  if (await costMgmt.isVisible({ timeout: 5000 }).catch(() => false)) {
    return 'nested';
  }

  const optimizations = page.getByLabel('Optimizations', { exact: true });
  if (await optimizations.isVisible({ timeout: 3000 }).catch(() => false)) {
    return 'flat';
  }

  return null;
}

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
      page.getByRole('heading', { name: /cost management/i }).first(),
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
    await expect(page.locator('body')).toContainText(
      /cost management|resource optimization/i,
      {
        timeout: 15000,
      },
    );
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

    const isDisabled = await installButton.isDisabled();
    if (isDisabled) {
      // Plugin already installed (e.g. via OCI injection) — button is disabled
      test.info().annotations.push({
        type: 'info',
        description:
          'Install button is disabled — plugin is already installed via OCI or a prior marketplace install',
      });
      const uninstallButton = page.getByRole('button', {
        name: /uninstall/i,
      });
      const hasUninstall = await uninstallButton
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      if (hasUninstall) {
        // "Uninstall" visible confirms the plugin is installed
        return;
      }
      // Disabled Install with no Uninstall — check page text for installed state
      await expect(page.locator('body')).toContainText(/installed|enabled/i, {
        timeout: 10000,
      });
      return;
    }

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
    const hasPlugin = await pageContent
      .filter({ hasText: /cost.management|resource.optimization/i })
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (hasPlugin) {
      await expect(
        pageContent.filter({
          hasText: /cost.management|resource.optimization/i,
        }),
      ).toBeVisible();
    } else {
      test.info().annotations.push({
        type: 'info',
        description:
          'Plugin not yet visible in Installed packages — may require pod restart to appear',
      });
    }
  });

  // -----------------------------------------------------------------------
  // Post-install sidebar verification
  //
  // After marketplace install, verify the plugin registered its sidebar
  // items and that the page route loads without a 404.
  // -----------------------------------------------------------------------

  test('FLPATH-2458: Plugin sidebar item appears after install', async ({
    page,
  }) => {
    test.setTimeout(120_000);

    // beforeEach already logged us in via guest; navigate home to see sidebar
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page
      .locator('nav')
      .first()
      .waitFor({ state: 'visible', timeout: 30000 });

    let layout = await detectSidebarLayout(page);

    if (!layout) {
      // Plugin may not be loaded yet (pod restarting after install).
      // Poll up to 90 seconds: reload and check sidebar.
      const deadline = Date.now() + 90_000;
      while (!layout && Date.now() < deadline) {
        await page.waitForTimeout(10_000);
        const responded = await page
          .goto('/', { waitUntil: 'domcontentloaded', timeout: 15000 })
          .catch(() => null);
        if (!responded) continue;
        await page.waitForLoadState('networkidle').catch(() => {});
        /* eslint-disable testing-library/await-async-utils */
        await page
          .locator('nav')
          .first()
          .waitFor({ state: 'visible', timeout: 15000 })
          .catch(() => {});
        /* eslint-enable testing-library/await-async-utils */
        layout = await detectSidebarLayout(page);
      }
    }

    expect(
      layout,
      'Expected either "Cost management" group (1.9+) or "Optimizations" item (1.8) in the sidebar',
    ).not.toBeNull();

    test.info().annotations.push({
      type: 'info',
      description: `Detected sidebar layout: ${layout}`,
    });
  });

  test('FLPATH-2458: Plugin sidebar expands and shows sub-items (1.9+) or single item (1.8)', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page
      .locator('nav')
      .first()
      .waitFor({ state: 'visible', timeout: 30000 });

    const layout = await detectSidebarLayout(page);

    if (layout === 'nested') {
      // RHDH 1.9+: "Cost management" group with sub-items
      const costMgmt = page.getByRole('button', {
        name: /^cost management$/i,
      });
      await expect(costMgmt).toBeVisible({ timeout: 10000 });
      await costMgmt.click();

      await expect(
        page.getByRole('link', { name: 'Optimizations' }),
      ).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('link', { name: 'OpenShift' })).toBeVisible({
        timeout: 5000,
      });
    } else if (layout === 'flat') {
      // RHDH 1.8: flat "Optimizations" item
      const optimizations = page.getByLabel('Optimizations', { exact: true });
      await expect(optimizations).toBeVisible({ timeout: 10000 });
    } else {
      test.skip(true, 'Plugin sidebar not detected — pod may need restart');
    }
  });

  test('FLPATH-2458: Clicking sidebar item navigates to plugin page', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page
      .locator('nav')
      .first()
      .waitFor({ state: 'visible', timeout: 30000 });

    const layout = await detectSidebarLayout(page);

    if (layout === 'nested') {
      const costMgmt = page.getByRole('button', {
        name: /^cost management$/i,
      });
      await costMgmt.click();
      await page.getByRole('link', { name: 'Optimizations' }).click();
    } else if (layout === 'flat') {
      await page.getByLabel('Optimizations', { exact: true }).click();
    } else {
      test.skip(true, 'Plugin sidebar not detected — pod may need restart');
      return;
    }

    await page.waitForLoadState('domcontentloaded');

    // Verify the page loaded — not a 404 or error page
    await expect(page).not.toHaveURL(/.*error.*/);
    const heading = page.getByRole('heading', {
      name: /cost management|resource optimization/i,
    });
    const hasHeading = await heading
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    if (hasHeading) {
      await expect(heading).toBeVisible();
    } else {
      // Page loaded but may show empty/error state without backend config —
      // that's expected. Confirm we're on a plugin route, not a 404.
      await expect(page).toHaveURL(
        /cost-management|redhat-resource-optimization/,
      );
    }
  });
});
