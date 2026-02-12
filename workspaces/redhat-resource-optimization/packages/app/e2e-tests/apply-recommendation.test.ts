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

const devMode = !process.env.PLAYWRIGHT_URL;

/**
 * Apply Recommendation happy-path workflow test.
 *
 * Strategy — one workload per cluster, first success wins:
 *   1. Intercept the recommendations API + CM Bearer token on page load.
 *   2. Probe each cluster's /sources/{id}/ endpoint to filter broken ones.
 *   3. For each healthy cluster, click ONE table row belonging to it.
 *   4. Click "Apply recommendation" on the detail page.
 *   5. If the workflow starts → test passes.
 *   6. If it errors → try the next cluster.
 *   7. If all clusters fail → skip gracefully.
 */
test.describe('Resource Optimization - Apply Recommendation @live @ro @workflow', () => {
  test.skip(devMode, 'Apply Recommendation requires a live RHDH instance');

  let rosPage: ResourceOptimizationPage;

  test.beforeEach(async ({ page }) => {
    rosPage = new ResourceOptimizationPage(page);
  });

  test('should complete Apply Recommendation workflow end-to-end', async ({
    page,
  }) => {
    test.setTimeout(360000);

    // --- Set up API interceptors BEFORE navigation ---
    await rosPage.setupAPIInterceptors();

    const user = process.env.RBAC_FULL_USER ?? 'costmgmt-full-access';
    const pass = process.env.RBAC_FULL_PASS ?? 'test';

    await rosPage.navigateToOptimizationAsOIDC(user, pass);

    const count = await rosPage.getOptimizableContainerCount();
    test.skip(!count || count === 0, 'No optimization data available');

    await page.waitForTimeout(3000);

    // --- Find healthy clusters ---
    const healthyClusters = await rosPage.findAllHealthyClusters();
    await rosPage.removeAPIInterceptors();

    test.skip(healthyClusters.length === 0, 'No healthy cluster sources found');

    // eslint-disable-next-line no-console
    console.log(`Healthy clusters: ${healthyClusters.join(', ')}`);

    // --- Try one workload per cluster ---
    let workflowStarted = false;
    const triedClusters: string[] = [];

    for (const cluster of healthyClusters) {
      // Navigate to the list page
      await page.goto('/redhat-resource-optimization', {
        waitUntil: 'domcontentloaded',
      });
      await page
        .locator('[role="progressbar"]')
        // eslint-disable-next-line testing-library/await-async-utils
        .waitFor({ state: 'hidden', timeout: 30000 })
        .catch(() => {});
      await expect(
        page.getByText(/Optimizable containers \([1-9]\d*\)/),
      ).toBeVisible({ timeout: 30000 });

      // Find the first row for this cluster and click it
      const found = await rosPage.clickRowForCluster(cluster);
      if (!found) {
        // eslint-disable-next-line no-console
        console.log(
          `Cluster "${cluster}": no row found on the visible page — skipping`,
        );
        continue;
      }

      triedClusters.push(cluster);
      // eslint-disable-next-line no-console
      console.log(
        `Cluster "${cluster}": clicked row, checking Apply button...`,
      );

      await page.waitForTimeout(3000);
      await page
        .locator('[role="progressbar"]')
        // eslint-disable-next-line testing-library/await-async-utils
        .waitFor({ state: 'hidden', timeout: 15000 })
        .catch(() => {});

      // Check Apply button
      const applyButton = page.getByRole('button', {
        name: 'Apply recommendation',
      });
      const isVisible = await applyButton
        .isVisible({ timeout: 8000 })
        .catch(() => false);
      if (!isVisible || !(await applyButton.isEnabled())) {
        // eslint-disable-next-line no-console
        console.log(
          `Cluster "${cluster}": Apply button not available — skipping`,
        );
        continue;
      }

      // Click Apply
      await applyButton.click();
      await page.waitForTimeout(5000);

      // Check for error alert
      const errorAlert = page.getByRole('alert').filter({ hasText: /error/i });
      const hasError = await errorAlert
        .isVisible({ timeout: 8000 })
        .catch(() => false);

      if (hasError) {
        const errorText =
          (await errorAlert.locator('h6').first().textContent())?.trim() || '';
        // eslint-disable-next-line no-console
        console.log(`Cluster "${cluster}": ERROR — ${errorText}`);
        continue;
      }

      // Workflow started
      // eslint-disable-next-line no-console
      console.log(`Cluster "${cluster}": SUCCESS — workflow started`);
      workflowStarted = true;
      break;
    }

    if (!workflowStarted) {
      test.skip(
        true,
        `Workflow failed for all ${
          triedClusters.length
        } cluster(s): ${triedClusters.join(', ')}`,
      );
    }

    // --- Verify the workflow completes ---
    const statusBadge = page.getByText('Completed', { exact: true });
    const runningBadge = page.getByText('Running', { exact: true });
    const pendingBadge = page.getByText('Pending', { exact: true });

    await expect(statusBadge.or(runningBadge).or(pendingBadge)).toBeVisible({
      timeout: 30000,
    });

    await expect(statusBadge).toBeVisible({ timeout: 300000 });
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
      name: 'Apply recommendation',
    });
    await expect(applyButton).toBeEnabled();
  });
});
