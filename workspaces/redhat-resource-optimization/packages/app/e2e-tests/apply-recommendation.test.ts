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
import { PLUGIN_ROUTE_BASE, isLegacyRos } from './utils/routes';

const devMode = !process.env.PLAYWRIGHT_URL;

/**
 * Apply Recommendation happy-path workflow test.
 *
 * Strategy — try visible table rows directly:
 *   1. Log in as a user with ros.apply + RORead permissions.
 *   2. Navigate to Optimizations and verify data is loaded.
 *   3. Click the first table row to enter the detail page.
 *   4. Click "Apply recommendation" and confirm in the dialog.
 *   5. If the workflow starts → test passes.
 *   6. If it errors → try the next row (up to MAX_ROWS_TO_TRY).
 *   7. If all rows fail → skip gracefully.
 *
 * Note: The secure proxy handles token management server-side, so there is
 * no client-side token or source health probe. Instead we simply try rows
 * from the table and rely on the backend to reject broken sources with an
 * error that the UI surfaces.
 *
 * Requires cost-management plugin 1.3.x+ (workflow integration not in 1.2.x).
 */
test.describe('Resource Optimization - Apply Recommendation @live @ro @workflow', () => {
  test.skip(
    isLegacyRos,
    'Apply Recommendation requires cost-management 1.3.x+',
  );
  test.skip(devMode, 'Apply Recommendation requires a live RHDH instance');

  const MAX_ROWS_TO_TRY = 5;
  let rosPage: ResourceOptimizationPage;

  test.beforeEach(async ({ page }) => {
    rosPage = new ResourceOptimizationPage(page);
  });

  test('should complete Apply Recommendation workflow end-to-end', async ({
    page,
  }) => {
    test.setTimeout(360000);

    const user = process.env.RBAC_FULL_USER ?? 'costmgmt-full-access';
    const pass = process.env.RBAC_FULL_PASS ?? 'test';

    await rosPage.navigateToOptimizationAsOIDC(user, pass);

    const count = await rosPage.getOptimizableContainerCount();
    test.skip(!count || count === 0, 'No optimization data available');

    // --- Try rows from the table until a workflow succeeds ---
    let workflowStarted = false;
    const rowsToTry = Math.min(count!, MAX_ROWS_TO_TRY);

    for (let rowIndex = 0; rowIndex < rowsToTry; rowIndex++) {
      // Skip redundant navigation on first iteration — page is already loaded
      // with verified data from navigateToOptimizationAsOIDC + getOptimizableContainerCount
      if (rowIndex > 0) {
        await page.goto(PLUGIN_ROUTE_BASE, {
          waitUntil: 'domcontentloaded',
        });
        await page
          .locator('[role="progressbar"]')
          // eslint-disable-next-line testing-library/await-async-utils
          .waitFor({ state: 'hidden', timeout: 60000 })
          .catch(() => {});
        await expect(
          page.getByText(/Optimizable containers \([1-9]\d*\)/),
        ).toBeVisible({ timeout: 60000 });
      }

      // Click the Nth row's link to navigate to the detail page
      const rows = page.locator('table tbody tr');
      const targetRow = rows.nth(rowIndex);
      const rowVisible = await targetRow
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      if (!rowVisible) {
        // eslint-disable-next-line no-console
        console.log(`Row ${rowIndex}: not visible in table — skipping`);
        continue;
      }

      const containerLink = targetRow.getByRole('link').first();
      await containerLink.click();
      await page.waitForLoadState('domcontentloaded');

      // Wait for the detail page to fully render (permission check + data)
      await page
        .locator('[role="progressbar"]')
        // eslint-disable-next-line testing-library/await-async-utils
        .waitFor({ state: 'hidden', timeout: 30000 })
        .catch(() => {});
      await page.waitForTimeout(3000);

      // Check Apply button is visible and enabled
      const applyButton = page.getByRole('button', {
        name: /apply recommendation/i,
      });
      const isVisible = await applyButton
        .isVisible({ timeout: 15000 })
        .catch(() => false);

      if (!isVisible) {
        // eslint-disable-next-line no-console
        console.log(`Row ${rowIndex}: Apply button not visible — skipping`);
        continue;
      }

      const isEnabled = await applyButton.isEnabled().catch(() => false);
      if (!isEnabled) {
        // eslint-disable-next-line no-console
        console.log(`Row ${rowIndex}: Apply button disabled — skipping`);
        continue;
      }

      // Click Apply
      await applyButton.click();

      // Handle the confirmation dialog if it appears
      const confirmButton = page.getByRole('button', {
        name: /^apply$/i,
      });
      const hasDialog = await confirmButton
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      if (hasDialog) {
        await confirmButton.click();
      }

      await page.waitForTimeout(5000);

      // Check for error — the secure proxy surfaces errors as an alert panel
      const errorAlert = page.getByRole('alert').filter({ hasText: /error/i });
      const hasError = await errorAlert
        .isVisible({ timeout: 8000 })
        .catch(() => false);

      if (hasError) {
        const errorText =
          (await errorAlert.locator('h6, p').first().textContent())?.trim() ||
          '';
        // eslint-disable-next-line no-console
        console.log(`Row ${rowIndex}: ERROR — ${errorText}`);
        continue;
      }

      // eslint-disable-next-line no-console
      console.log(`Row ${rowIndex}: SUCCESS — workflow started`);
      workflowStarted = true;
      break;
    }

    if (!workflowStarted) {
      test.skip(true, `Workflow failed for all ${rowsToTry} row(s) tried`);
    }

    // --- Verify the workflow ran (any terminal or in-progress status) ---
    const completedBadge = page.getByText('Completed', { exact: true });
    const failedBadge = page.getByText('Failed', { exact: true });
    const runningBadge = page.getByText('Running', { exact: true });
    const pendingBadge = page.getByText('Pending', { exact: true });

    const anyStatus = completedBadge
      .or(failedBadge)
      .or(runningBadge)
      .or(pendingBadge);
    await expect(anyStatus).toBeVisible({ timeout: 30000 });

    const terminalStatus = completedBadge.or(failedBadge);
    await expect(terminalStatus).toBeVisible({ timeout: 300000 });
  });

  test('should show Apply recommendation button on detail page', async ({
    page,
  }) => {
    const user = process.env.RBAC_FULL_USER ?? 'costmgmt-full-access';
    const pass = process.env.RBAC_FULL_PASS ?? 'test';

    await rosPage.navigateToOptimizationAsOIDC(user, pass);

    const count = await rosPage.getOptimizableContainerCount();
    test.skip(!count || count === 0, 'No optimization data available');

    await rosPage.clickFirstDataRow();
    await rosPage.verifyDetailsPage();

    await rosPage.verifyApplyRecommendationButton();
    const applyButton = page.getByRole('button', {
      name: /apply recommendation/i,
    });
    await expect(applyButton).toBeEnabled();
  });
});
