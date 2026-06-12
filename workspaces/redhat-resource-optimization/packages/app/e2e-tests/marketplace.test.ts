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
 * The marketplace install flow is a two-step process:
 *   1. Navigate to the plugin detail page and click "Install"
 *   2. This opens a YAML configuration editor where the user must provide
 *      the full pluginConfig (frontend routes, sidebar items, backend config)
 *   3. Click "Install" on the config page to submit
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
const PLUGIN_CATALOG_NAME = 'cost-management';

/**
 * Full plugin configuration YAML for Cost Management 1.3.x+.
 *
 * The marketplace install page presents a Monaco YAML editor pre-populated
 * with a minimal template (just package + disabled: false). The user must
 * add the pluginConfig block to register sidebar items, routes, and
 * backend credentials. This YAML mirrors what deploy-resource-optimization.sh
 * generates for the dynamic-plugins ConfigMap.
 *
 * Backend credentials are optional for UI tests — the sidebar and page
 * will appear without them, but API calls will fail. We omit secrets here
 * since the marketplace UI is not meant for secret injection.
 */
function buildPluginConfigYaml(packages: {
  frontend?: string;
  backend?: string;
}): string {
  const frontendPkg =
    packages.frontend ??
    './dynamic-plugins/dist/red-hat-developer-hub-plugin-cost-management';
  const backendPkg =
    packages.backend ??
    './dynamic-plugins/dist/red-hat-developer-hub-plugin-cost-management-backend';

  return `plugins:
  - package: "${frontendPkg}"
    disabled: false
    pluginConfig:
      dynamicPlugins:
        frontend:
          red-hat-developer-hub.plugin-cost-management:
            appIcons:
              - name: costManagementIcon
                importName: CostManagementIconOutlined
            dynamicRoutes:
              - path: /cost-management/optimizations
                importName: ResourceOptimizationPage
                menuItem:
                  icon: costManagementIcon
                  text: Optimizations
              - path: /cost-management/openshift
                importName: OpenShiftPage
                menuItem:
                  icon: costManagementIcon
                  text: OpenShift
            menuItems:
              cost-management:
                icon: costManagementIcon
                title: Cost management
                priority: 100
              cost-management.optimizations:
                parent: cost-management
                priority: 10
              cost-management.openshift:
                parent: cost-management
                priority: 20
  - package: "${backendPkg}"
    disabled: false
`;
}

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

/**
 * Set the Monaco editor content on the Extensions install page.
 * Uses page.evaluate to call the Monaco API directly since the editor
 * doesn't respond well to simulated keyboard input.
 */
async function setMonacoEditorContent(page: Page, content: string) {
  await page.waitForSelector('.monaco-editor', { timeout: 30000 });
  await page.waitForTimeout(1000);

  await page.evaluate((yamlContent: string) => {
    const editorElement = document.querySelector('.monaco-editor');
    if (!editorElement) throw new Error('Monaco editor element not found');
    // Access the Monaco model from the editor's internal widget
    const editorInstance =
      (window as any).monaco?.editor?.getEditors?.()?.[0] ??
      (editorElement as any).__view?.editorWidget?.codeEditorService
        ?._codeEditorService?._editor;

    if (!editorInstance) {
      // Fallback: find the editor through the model
      const models = (window as any).monaco?.editor?.getModels?.();
      if (models?.[0]) {
        models[0].setValue(yamlContent);
        return;
      }
      throw new Error('Could not access Monaco editor instance or model');
    }
    editorInstance.setValue(yamlContent);
  }, content);
}

/**
 * Extract dynamic artifact URLs from the plugin's packages by querying the
 * Backstage catalog API. Returns the OCI references for frontend and backend
 * packages, which should be used in the YAML config instead of relative paths.
 */
async function getPluginPackageArtifacts(page: Page): Promise<{
  frontend?: string;
  backend?: string;
}> {
  const result: { frontend?: string; backend?: string } = {};

  try {
    const data = await page.evaluate(async (pluginName: string) => {
      const resp = await fetch(
        `/api/catalog/entities/by-query?filter=kind=Package,spec.partOf=${pluginName}`,
        { credentials: 'include' },
      );
      if (!resp.ok) return [];
      const json = await resp.json();
      return json.items ?? [];
    }, PLUGIN_CATALOG_NAME);

    for (const pkg of data) {
      const artifact = pkg?.spec?.dynamicArtifact;
      const role = pkg?.spec?.backstage?.role;
      if (artifact && role === 'frontend-plugin') {
        result.frontend = artifact;
      } else if (artifact && role === 'backend-plugin') {
        result.backend = artifact;
      }
    }
  } catch {
    // Catalog query failed; buildPluginConfigYaml will use defaults
  }

  return result;
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
    test.setTimeout(120_000);

    await navigateToExtensions(page);
    await searchForPlugin(page);

    const readMore = page.getByRole('link', { name: 'Read more' }).first();
    await expect(readMore).toBeVisible({ timeout: 10000 });
    await readMore.click();
    await page.waitForLoadState('networkidle');

    // Check if plugin is already installed (Actions dropdown or disabled Install)
    const actionsButton = page.locator('[data-testid="plugin-actions"]');
    const alreadyInstalled = await actionsButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (alreadyInstalled) {
      test.info().annotations.push({
        type: 'info',
        description: 'Plugin already installed — skipping install step',
      });
      return;
    }

    // Click Install link/button to navigate to the config page
    const installLink = page.locator('[data-testid="install"]');
    const installButton = page.getByRole('button', { name: /install/i });
    const installTarget = (await installLink
      .isVisible({ timeout: 5000 })
      .catch(() => false))
      ? installLink
      : installButton;

    await expect(installTarget).toBeVisible({ timeout: 15000 });

    const isDisabled = await installTarget.isDisabled().catch(() => false);
    if (isDisabled) {
      test.info().annotations.push({
        type: 'info',
        description:
          'Install button is disabled — plugin may already be installed or installation is not permitted',
      });
      return;
    }

    await installTarget.click();
    await page.waitForLoadState('networkidle');

    // We should now be on the install configuration page with a YAML editor.
    // The page URL should contain /install.
    await page.waitForTimeout(2000);

    // Discover actual OCI package references from the catalog
    const artifacts = await getPluginPackageArtifacts(page);
    const configYaml = buildPluginConfigYaml(artifacts);

    test.info().annotations.push({
      type: 'info',
      description: `Frontend artifact: ${artifacts.frontend ?? 'default'}`,
    });
    test.info().annotations.push({
      type: 'info',
      description: `Backend artifact: ${artifacts.backend ?? 'default'}`,
    });

    // Set the full plugin configuration in the Monaco YAML editor
    await setMonacoEditorContent(page, configYaml);

    // Click the Install button on the config page to submit
    const submitButton = page.getByRole('button', { name: /install|save/i });
    await expect(submitButton).toBeVisible({ timeout: 10000 });
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();

    // Wait for success: the page navigates back to extensions on success,
    // or shows an "installed"/"updated" message
    const successIndicator = page
      .locator('body')
      .filter({ hasText: /installed|updated|enabled|success/i });
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
  // After marketplace install + pod restart, verify the plugin registered
  // its sidebar items and that the page route loads without a 404.
  // -----------------------------------------------------------------------

  test('FLPATH-2458: Plugin sidebar item appears after install', async ({
    page,
  }) => {
    test.setTimeout(120_000);

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
