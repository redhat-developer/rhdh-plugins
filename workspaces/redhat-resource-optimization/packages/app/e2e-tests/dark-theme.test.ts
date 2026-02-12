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
import { ResourceOptimizationPage } from './pages/ResourceOptimizationPage';
import { performLogin } from './fixtures/auth';

const devMode = !process.env.PLAYWRIGHT_URL;

/**
 * Dark theme rendering tests for the Resource Optimization plugin.
 * Covers: FLPATH-3120 (dark theme data display).
 *
 * Known bug FLPATH-3234: Chart axis labels may be invisible in dark theme.
 */
test.describe('Resource Optimization - Dark Theme @live @ro', () => {
  // Theme tests navigate to /settings then back — allow more time under parallel load
  test.describe.configure({ timeout: 120000 });

  // Skip in devMode – theme switching requires a live RHDH instance
  test.skip(devMode, 'Dark theme tests require a live RHDH instance');

  let rosPage: ResourceOptimizationPage;

  test.beforeEach(async ({ page }) => {
    rosPage = new ResourceOptimizationPage(page);
  });

  test('should switch to dark theme and display readable table', async ({
    page,
  }) => {
    // Login and switch to dark theme
    await performLogin(page);
    await rosPage.switchTheme('Dark');

    // Navigate to the Resource Optimization page
    await page.goto('/redhat-resource-optimization', {
      waitUntil: 'domcontentloaded',
    });
    await rosPage.waitForPageLoad();

    // Verify the table is still visible and readable
    const count = await rosPage.getOptimizableContainerCount();
    if (count && count > 0) {
      await rosPage.viewOptimizations();
      await rosPage.verifyTableHeaders();

      const rowCount = await rosPage.getTableRowCount();
      expect(rowCount).toBeGreaterThan(0);
    } else {
      // Even with no data, the page should render correctly
      await expect(page.getByText('Resource Optimization')).toBeVisible();
    }
  });

  test('should render charts section on detail page in dark theme', async ({
    page,
  }) => {
    await performLogin(page);
    await rosPage.switchTheme('Dark');

    await page.goto('/redhat-resource-optimization', {
      waitUntil: 'domcontentloaded',
    });
    await rosPage.waitForPageLoad();

    const count = await rosPage.getOptimizableContainerCount();
    test.skip(!count || count === 0, 'No optimization data available');

    // Navigate to a detail page
    await rosPage.clickFirstDataRow();
    await rosPage.verifyDetailsPage();

    // Verify chart sections render (even if axis labels have known bug FLPATH-3234)
    await rosPage.verifyUtilizationCharts();

    // Verify SVG chart elements exist
    const svgCharts = page.locator('svg');
    const svgCount = await svgCharts.count();
    expect(svgCount).toBeGreaterThan(0);
  });

  test.afterEach(async ({ page }) => {
    // Switch back to light theme to avoid affecting other tests
    try {
      await rosPage.switchTheme('Light');
    } catch {
      // Best effort cleanup
    }
  });
});
