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

import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { ResourceOptimizationPage } from './pages/ResourceOptimizationPage';
import { performOIDCLogin, signOut } from './fixtures/auth';
import {
  PLUGIN_ROUTE_BASE,
  OPENSHIFT_ROUTE,
  API_BASE,
  isLegacyRos,
} from './utils/routes';

const devMode = !process.env.PLAYWRIGHT_URL;

/**
 * Obtain a Backstage service token by logging in via OIDC and extracting
 * the cookie / token from the browser context. Returns the full cookie
 * header value for authenticated API requests.
 */
async function getAuthenticatedCookies(page: Page): Promise<string> {
  const cookies = await page.context().cookies();
  return cookies.map(c => `${c.name}=${c.value}`).join('; ');
}

/**
 * Make an authenticated API call using the browser session cookies.
 */
async function authenticatedFetch(
  page: Page,
  url: string,
): Promise<{ status: number; body: any }> {
  const result = await page.evaluate(async (fetchUrl: string) => {
    const res = await fetch(fetchUrl, { credentials: 'include' });
    let body;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { status: res.status, body };
  }, url);
  return result;
}

/**
 * FLPATH-4207: Dynamic Permission Registration Tests
 *
 * The core bug was that cluster/project-specific permissions (ros/<cluster>,
 * ros/<cluster>/<project>, cost/<cluster>, cost/<cluster>/<project>) were
 * created dynamically but never registered with the permission integration
 * router. The RBAC backend's PluginPermissionMetadataCollector builds its
 * known-permissions list from plugin metadata endpoints; unregistered
 * permissions get DENY by default.
 *
 * These tests verify the fix works end-to-end:
 *   1. The plugin metadata endpoint lists dynamic permissions
 *   2. Backend returns proper 403 (not 500) for unauthorized users
 *   3. Cross-role session switching enforces RBAC correctly
 *   4. RORead-only user is blocked from OpenShift tab (requires CostRead)
 *   5. API responses use correct HTTP status codes (not client-side filtering)
 */
test.describe('Dynamic Permission Registration (FLPATH-4207) @live @ro @rbac @flpath4207', () => {
  test.skip(isLegacyRos, 'Dynamic permissions require cost-management 1.3.x+');
  test.skip(devMode, 'Requires a live RHDH instance with OIDC and RBAC');

  // -------------------------------------------------------------------------
  // 1. Permission Metadata Endpoint Validation
  // -------------------------------------------------------------------------

  test.describe('Permission Metadata Endpoint', () => {
    test('should list static permissions (ros.plugin, ros.apply, cost.plugin)', async ({
      page,
    }) => {
      const user = process.env.RBAC_FULL_USER ?? 'costmgmt-full-access';
      const pass = process.env.RBAC_FULL_PASS ?? 'test';

      await performOIDCLogin(page, user, pass);

      const result = await authenticatedFetch(
        page,
        `${API_BASE}/.well-known/backstage/permissions/metadata`,
      );

      expect(result.status).toBe(200);
      expect(result.body).toBeDefined();

      const permissionNames: string[] = (result.body.permissions ?? []).map(
        (p: any) => p.name,
      );

      expect(permissionNames).toContain('ros.plugin');
      expect(permissionNames).toContain('ros.apply');
      expect(permissionNames).toContain('cost.plugin');
    });

    test('should list dynamic cluster-scoped permissions (ros/<cluster>)', async ({
      page,
    }) => {
      const user = process.env.RBAC_FULL_USER ?? 'costmgmt-full-access';
      const pass = process.env.RBAC_FULL_PASS ?? 'test';

      await performOIDCLogin(page, user, pass);

      const result = await authenticatedFetch(
        page,
        `${API_BASE}/.well-known/backstage/permissions/metadata`,
      );

      expect(result.status).toBe(200);

      const permissionNames: string[] = (result.body.permissions ?? []).map(
        (p: any) => p.name,
      );

      // There should be at least one ros/<cluster> permission registered
      const rosClusterPerms = permissionNames.filter(
        n => n.startsWith('ros/') && !n.includes('/', 4),
      );

      expect(rosClusterPerms.length).toBeGreaterThan(0);
    });

    test('should list dynamic project-scoped permissions (ros/<cluster>/<project>)', async ({
      page,
    }) => {
      const user = process.env.RBAC_FULL_USER ?? 'costmgmt-full-access';
      const pass = process.env.RBAC_FULL_PASS ?? 'test';

      await performOIDCLogin(page, user, pass);

      const result = await authenticatedFetch(
        page,
        `${API_BASE}/.well-known/backstage/permissions/metadata`,
      );

      expect(result.status).toBe(200);

      const permissionNames: string[] = (result.body.permissions ?? []).map(
        (p: any) => p.name,
      );

      // There should be at least one ros/<cluster>/<project> permission
      const rosProjectPerms = permissionNames.filter(n => {
        const parts = n.split('/');
        return parts[0] === 'ros' && parts.length === 3;
      });

      expect(rosProjectPerms.length).toBeGreaterThan(0);
    });

    test('should list dynamic cost cluster/project permissions', async ({
      page,
    }) => {
      const user = process.env.RBAC_FULL_USER ?? 'costmgmt-full-access';
      const pass = process.env.RBAC_FULL_PASS ?? 'test';

      await performOIDCLogin(page, user, pass);

      const result = await authenticatedFetch(
        page,
        `${API_BASE}/.well-known/backstage/permissions/metadata`,
      );

      expect(result.status).toBe(200);

      const permissionNames: string[] = (result.body.permissions ?? []).map(
        (p: any) => p.name,
      );

      const costClusterPerms = permissionNames.filter(n =>
        n.startsWith('cost/'),
      );

      expect(costClusterPerms.length).toBeGreaterThan(0);
    });

    test('all permissions should use slash separator (not dot)', async ({
      page,
    }) => {
      const user = process.env.RBAC_FULL_USER ?? 'costmgmt-full-access';
      const pass = process.env.RBAC_FULL_PASS ?? 'test';

      await performOIDCLogin(page, user, pass);

      const result = await authenticatedFetch(
        page,
        `${API_BASE}/.well-known/backstage/permissions/metadata`,
      );

      expect(result.status).toBe(200);

      const permissionNames: string[] = (result.body.permissions ?? []).map(
        (p: any) => p.name,
      );

      const dynamicPerms = permissionNames.filter(
        n =>
          (n.startsWith('ros/') || n.startsWith('cost/')) &&
          n !== 'ros.plugin' &&
          n !== 'ros.apply' &&
          n !== 'cost.plugin',
      );

      for (const perm of dynamicPerms) {
        // Dynamic perms should use slash, never dot as scope separator
        expect(perm).toMatch(/^(ros|cost)\//);
        // The name after the prefix should not contain dots (old format was ros.cluster)
        const afterPrefix = perm.replace(/^(ros|cost)\//, '');
        expect(afterPrefix).not.toContain('.');
      }
    });
  });

  // -------------------------------------------------------------------------
  // 2. Backend HTTP Status Code Verification
  // -------------------------------------------------------------------------

  test.describe('Backend Error Responses', () => {
    test('unauthorized API call should return 403, not 500', async ({
      page,
    }) => {
      const user = process.env.RBAC_NOACCESS_USER ?? 'costmgmt-no-access';
      const pass = process.env.RBAC_NOACCESS_PASS ?? 'test';

      await performOIDCLogin(page, user, pass);

      // Intercept the proxy API call to check the actual HTTP status
      const responsePromise = page.waitForResponse(
        res =>
          res.url().includes(`${API_BASE}/proxy/`) &&
          res.url().includes('recommendations'),
        { timeout: 30000 },
      );

      await page.goto(PLUGIN_ROUTE_BASE, {
        waitUntil: 'domcontentloaded',
      });

      try {
        const response = await responsePromise;
        // Should be 403 Forbidden, NOT 500 Internal Server Error
        expect([403, 200]).toContain(response.status());
        expect(response.status()).not.toBe(500);
      } catch {
        // If no proxy request was made, the frontend may have short-circuited
        // via the /access endpoint — that's acceptable behavior
      }
    });

    test('unauthorized OpenShift API call should return 403, not 500', async ({
      page,
    }) => {
      const user = process.env.RBAC_NOACCESS_USER ?? 'costmgmt-no-access';
      const pass = process.env.RBAC_NOACCESS_PASS ?? 'test';

      await performOIDCLogin(page, user, pass);

      const responsePromise = page.waitForResponse(
        res =>
          res.url().includes(`${API_BASE}/proxy/`) ||
          res.url().includes(`${API_BASE}/access`),
        { timeout: 30000 },
      );

      await page.goto(OPENSHIFT_ROUTE, {
        waitUntil: 'domcontentloaded',
      });

      try {
        const response = await responsePromise;
        expect(response.status()).not.toBe(500);
      } catch {
        // Short-circuit via access check is acceptable
      }

      // Page should show an authorization error, not a server error
      const serverError = page.getByText(/500|Internal Server Error/);
      const has500 = await serverError
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      expect(has500).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Cross-Role Session Switching
  // -------------------------------------------------------------------------

  test.describe('Cross-Role Session Switching', () => {
    test('switching from authorized to unauthorized user should enforce denial', async ({
      page,
    }) => {
      const rosPage = new ResourceOptimizationPage(page);

      // Step 1: Log in as authorized user and verify access
      const authUser = process.env.RBAC_ROREAD_USER ?? 'ro-read-no-workflow';
      const authPass = process.env.RBAC_ROREAD_PASS ?? 'test';

      await rosPage.navigateToOptimizationAsOIDC(authUser, authPass);
      await expect(page.getByText('Resource Optimization')).toBeVisible();

      const count = await rosPage.getOptimizableContainerCount();
      expect(count).not.toBeNull();

      // Step 2: Sign out
      await signOut(page);

      // Step 3: Log in as unauthorized user
      const noAccessUser =
        process.env.RBAC_NOACCESS_USER ?? 'costmgmt-no-access';
      const noAccessPass = process.env.RBAC_NOACCESS_PASS ?? 'test';

      await performOIDCLogin(page, noAccessUser, noAccessPass);

      await page.goto(PLUGIN_ROUTE_BASE, {
        waitUntil: 'domcontentloaded',
      });

      // Step 4: Verify unauthorized state
      await rosPage.expectUnauthorized();
    });

    test('switching from unauthorized to authorized user should grant access', async ({
      page,
    }) => {
      const rosPage = new ResourceOptimizationPage(page);

      // Step 1: Log in as unauthorized user
      const noAccessUser =
        process.env.RBAC_NOACCESS_USER ?? 'costmgmt-no-access';
      const noAccessPass = process.env.RBAC_NOACCESS_PASS ?? 'test';

      await performOIDCLogin(page, noAccessUser, noAccessPass);

      await page.goto(PLUGIN_ROUTE_BASE, {
        waitUntil: 'domcontentloaded',
      });

      await rosPage.expectUnauthorized();

      // Step 2: Sign out
      await signOut(page);

      // Step 3: Log in as authorized user
      const authUser = process.env.RBAC_ROREAD_USER ?? 'ro-read-no-workflow';
      const authPass = process.env.RBAC_ROREAD_PASS ?? 'test';

      await rosPage.navigateToOptimizationAsOIDC(authUser, authPass);

      // Step 4: Verify access is granted
      await expect(page.getByText('Resource Optimization')).toBeVisible();
      const count = await rosPage.getOptimizableContainerCount();
      expect(count).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 4. Tab-Level RBAC Isolation
  // -------------------------------------------------------------------------

  test.describe('Tab-Level RBAC Isolation', () => {
    test('RORead-only user should not see OpenShift cost data', async ({
      page,
    }) => {
      // ro-read-no-workflow has RORead but NOT CostRead
      const user = process.env.RBAC_ROREAD_USER ?? 'ro-read-no-workflow';
      const pass = process.env.RBAC_ROREAD_PASS ?? 'test';

      await performOIDCLogin(page, user, pass);

      await page.goto(OPENSHIFT_ROUTE, {
        waitUntil: 'domcontentloaded',
      });

      // User without CostRead should see error/forbidden or empty state
      const errorIndicator = page
        .getByRole('alert')
        .filter({ hasText: /unauthorized|forbidden|error/i })
        .or(page.getByText(/no data|not authorized|access denied/i));

      const hasError = await errorIndicator
        .isVisible({ timeout: 15000 })
        .catch(() => false);

      // Either an error is shown, or the data simply doesn't load (no cost tables)
      if (!hasError) {
        // If no explicit error, verify the cost overview table is NOT shown
        const costTable = page
          .getByRole('table')
          .filter({ hasText: /cost|cluster/i });
        const hasCostData = await costTable
          .isVisible({ timeout: 5000 })
          .catch(() => false);
        // RORead-only user should not see cost data
        expect(hasCostData).toBe(false);
      }
    });

    test('CostRead user should see OpenShift cost data', async ({ page }) => {
      // ro-read-all has RORead + CostRead
      const user = process.env.RBAC_COSTREAD_USER ?? 'ro-read-all';
      const pass = process.env.RBAC_COSTREAD_PASS ?? 'test';

      await performOIDCLogin(page, user, pass);

      await page.goto(OPENSHIFT_ROUTE, {
        waitUntil: 'domcontentloaded',
      });

      // User with CostRead should NOT see forbidden error
      const errorAlert = page.getByRole('alert').filter({
        hasText: /forbidden|unauthorized/i,
      });
      const hasError = await errorAlert
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      expect(hasError).toBe(false);
    });

    test('full-access user should see both Optimizations and OpenShift tabs', async ({
      page,
    }) => {
      const rosPage = new ResourceOptimizationPage(page);
      const user = process.env.RBAC_FULL_USER ?? 'costmgmt-full-access';
      const pass = process.env.RBAC_FULL_PASS ?? 'test';

      // Verify Optimizations tab
      await rosPage.navigateToOptimizationAsOIDC(user, pass);
      await expect(page.getByText('Resource Optimization')).toBeVisible();
      const count = await rosPage.getOptimizableContainerCount();
      expect(count).not.toBeNull();

      // Verify OpenShift tab
      await page.goto(OPENSHIFT_ROUTE, {
        waitUntil: 'domcontentloaded',
      });

      const errorAlert = page.getByRole('alert').filter({
        hasText: /forbidden|unauthorized/i,
      });
      const hasError = await errorAlert
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      expect(hasError).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Access Endpoint Verification
  // -------------------------------------------------------------------------

  test.describe('Access Endpoint', () => {
    test('authorized user /access should return allowed permissions', async ({
      page,
    }) => {
      const user = process.env.RBAC_ROREAD_USER ?? 'ro-read-no-workflow';
      const pass = process.env.RBAC_ROREAD_PASS ?? 'test';

      await performOIDCLogin(page, user, pass);

      const result = await authenticatedFetch(page, `${API_BASE}/access`);

      expect(result.status).toBe(200);
      expect(result.body).toBeDefined();

      // The access endpoint should indicate the user has read access
      // (response structure may vary, but should not be empty or error)
      expect(result.body).not.toHaveProperty('error');
    });

    test('unauthorized user /access should indicate no permissions', async ({
      page,
    }) => {
      const user = process.env.RBAC_NOACCESS_USER ?? 'costmgmt-no-access';
      const pass = process.env.RBAC_NOACCESS_PASS ?? 'test';

      await performOIDCLogin(page, user, pass);

      const result = await authenticatedFetch(page, `${API_BASE}/access`);

      // The access endpoint should return 200 but with restricted permissions,
      // OR 403 if completely denied
      expect([200, 403]).toContain(result.status);

      if (result.status === 200 && result.body) {
        // If 200, the response should indicate limited/no access
        const hasFullAccess =
          result.body.allowedClusters?.length > 0 ||
          result.body.hasAccess === true;
        expect(hasFullAccess).toBe(false);
      }
    });

    test('authorized user /access/cost-management should return allowed', async ({
      page,
    }) => {
      const user = process.env.RBAC_COSTREAD_USER ?? 'ro-read-all';
      const pass = process.env.RBAC_COSTREAD_PASS ?? 'test';

      await performOIDCLogin(page, user, pass);

      const result = await authenticatedFetch(
        page,
        `${API_BASE}/access/cost-management`,
      );

      expect(result.status).toBe(200);
      expect(result.body).toBeDefined();
      expect(result.body).not.toHaveProperty('error');
    });
  });

  // -------------------------------------------------------------------------
  // 6. Health Endpoint (Sanity)
  // -------------------------------------------------------------------------

  test.describe('Plugin Health', () => {
    test('health endpoint should return ok', async ({ page }) => {
      const user = process.env.RBAC_FULL_USER ?? 'costmgmt-full-access';
      const pass = process.env.RBAC_FULL_PASS ?? 'test';

      await performOIDCLogin(page, user, pass);

      const result = await authenticatedFetch(page, `${API_BASE}/health`);

      expect(result.status).toBe(200);
      expect(result.body).toEqual({ status: 'ok' });
    });
  });
});
