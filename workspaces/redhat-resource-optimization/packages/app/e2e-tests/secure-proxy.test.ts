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
import { performOIDCLogin } from './fixtures/auth';
import {
  PLUGIN_ROUTE_BASE,
  OPENSHIFT_ROUTE,
  isLegacyRos,
} from './utils/routes';

const devMode = !process.env.PLAYWRIGHT_URL;

/**
 * Security tests for the Cost Management secure proxy (FLPATH-3503 epic).
 *
 * Covers:
 *   - FLPATH-3487: Server-side RBAC enforcement (no client-side token exposure)
 *   - FLPATH-3488: Apply Recommendation requires ros.apply permission
 *   - FLPATH-3489: Permission names use slash separators (no dot ambiguity)
 *   - FLPATH-3490: Audit logging (verified indirectly via correct HTTP responses)
 *   - FLPATH-3491: resourceType validation on Apply Recommendation
 *   - FLPATH-3492: Apply Recommendation routed through backend proxy
 *
 * Users on the cluster:
 *   - ro-read-no-workflow:    RORead role (can view Optimizations, not apply)
 *   - costmgmt-full-access:  RORead + ros.apply + CostRead (full access)
 *   - ro-read-all:           RORead + CostRead (can view both tabs, cannot apply)
 *   - costmgmt-no-access:   No ROS/cost roles
 *
 * Requires cost-management plugin 1.3.x+ (secure proxy not available in 1.2.x).
 */
test.describe('Secure Proxy & RBAC Security @live @ro @security', () => {
  test.skip(isLegacyRos, 'Secure proxy requires cost-management 1.3.x+');
  test.skip(devMode, 'Security tests require a live RHDH instance with OIDC');

  // -------------------------------------------------------------------------
  // FLPATH-3487: Server-side RBAC enforcement
  // -------------------------------------------------------------------------

  test.describe('Server-Side RBAC (FLPATH-3487)', () => {
    test('authorized user should see Optimizations data', async ({ page }) => {
      const rosPage = new ResourceOptimizationPage(page);
      const user = process.env.RBAC_ROREAD_USER ?? 'ro-read-no-workflow';
      const pass = process.env.RBAC_ROREAD_PASS ?? 'test';

      await rosPage.navigateToOptimizationAsOIDC(user, pass);

      await expect(page.getByText('Resource Optimization')).toBeVisible();

      const count = await rosPage.getOptimizableContainerCount();
      expect(count).not.toBeNull();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('authorized user should see OpenShift cost data', async ({ page }) => {
      const user = process.env.RBAC_COSTREAD_USER ?? 'ro-read-all';
      const pass = process.env.RBAC_COSTREAD_PASS ?? 'test';

      await performOIDCLogin(page, user, pass);

      await page.goto(OPENSHIFT_ROUTE, {
        waitUntil: 'domcontentloaded',
      });

      // User with CostRead role should see cost data, not an error
      const errorAlert = page.getByRole('alert').filter({
        hasText: /forbidden|unauthorized|error/i,
      });
      const hasError = await errorAlert
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      expect(hasError).toBe(false);
    });

    test('unauthorized user should get Forbidden on Optimizations', async ({
      page,
    }) => {
      const rosPage = new ResourceOptimizationPage(page);
      const user = process.env.RBAC_NOACCESS_USER ?? 'costmgmt-no-access';
      const pass = process.env.RBAC_NOACCESS_PASS ?? 'test';

      await performOIDCLogin(page, user, pass);

      await page.goto(PLUGIN_ROUTE_BASE, {
        waitUntil: 'domcontentloaded',
      });

      await rosPage.expectUnauthorized();
    });

    test('unauthorized user should get Forbidden on OpenShift tab', async ({
      page,
    }) => {
      const user = process.env.RBAC_NOACCESS_USER ?? 'costmgmt-no-access';
      const pass = process.env.RBAC_NOACCESS_PASS ?? 'test';

      await performOIDCLogin(page, user, pass);

      await page.goto(OPENSHIFT_ROUTE, {
        waitUntil: 'domcontentloaded',
      });

      // Should show Forbidden, NOT a 500 Internal Server Error
      // RHDH 1.10+ RBAC checks take longer to resolve (FLPATH-4427)
      await page.waitForLoadState('networkidle').catch(() => {});
      const errorAlert = page.getByRole('alert').filter({
        hasText: /forbidden|unauthorized|error|access denied/i,
      });
      await expect(errorAlert).toBeVisible({ timeout: 30000 });

      // Specifically should NOT contain "500" or "Internal Server Error"
      const internalError = page.getByText(/500|Internal Server Error/);
      const has500 = await internalError
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      expect(has500).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // FLPATH-3488 / FLPATH-3492: Apply Recommendation Authorization
  // -------------------------------------------------------------------------

  test.describe('Apply Recommendation Auth (FLPATH-3488)', () => {
    test('user without ros.apply should see Apply button disabled', async ({
      page,
    }) => {
      const rosPage = new ResourceOptimizationPage(page);
      const user = process.env.RBAC_ROREAD_USER ?? 'ro-read-no-workflow';
      const pass = process.env.RBAC_ROREAD_PASS ?? 'test';

      await rosPage.navigateToOptimizationAsOIDC(user, pass);

      const count = await rosPage.getOptimizableContainerCount();
      test.skip(!count || count === 0, 'No optimization data available');

      await rosPage.clickFirstDataRow();
      await rosPage.verifyDetailsPage();

      await rosPage.verifyApplyRecommendationDisabled();
    });

    test('user with ros.apply should see Apply button enabled', async ({
      page,
    }) => {
      const rosPage = new ResourceOptimizationPage(page);
      const user = process.env.RBAC_FULL_USER ?? 'costmgmt-full-access';
      const pass = process.env.RBAC_FULL_PASS ?? 'test';

      await rosPage.navigateToOptimizationAsOIDC(user, pass);

      const count = await rosPage.getOptimizableContainerCount();
      test.skip(!count || count === 0, 'No optimization data available');

      await rosPage.clickFirstDataRow();
      await rosPage.verifyDetailsPage();

      const applyButton = page.getByRole('button', {
        name: /apply recommendation/i,
      });
      await expect(applyButton).toBeVisible();
      await expect(applyButton).toBeEnabled();
    });
  });

  // -------------------------------------------------------------------------
  // FLPATH-3489: Permission name separator (slash vs dot)
  // -------------------------------------------------------------------------

  test.describe('Permission Name Separator (FLPATH-3489)', () => {
    test('cluster-scoped RBAC should work with slash-separated names', async ({
      page,
    }) => {
      const rosPage = new ResourceOptimizationPage(page);
      // This user has ros/cluster73 permission (slash-separated)
      const user = process.env.RBAC_ROREAD_USER ?? 'ro-read-no-workflow';
      const pass = process.env.RBAC_ROREAD_PASS ?? 'test';

      await rosPage.navigateToOptimizationAsOIDC(user, pass);

      // If slash-separated permissions work, the user sees data
      await expect(page.getByText('Resource Optimization')).toBeVisible();

      const count = await rosPage.getOptimizableContainerCount();
      expect(count).not.toBeNull();
    });
  });
});
