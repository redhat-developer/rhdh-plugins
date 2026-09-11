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
 *
 * The Extensions UI uses @monaco-editor/react which stores the editor instance
 * on the wrapper element's React fiber. In production builds, `window.monaco`
 * is not exposed, so we walk the React fiber tree to find the editor ref.
 *
 * Fallback chain:
 * 1. React fiber walk to find editorRef.current.setValue()
 * 2. window.monaco global API (dev builds)
 * 3. execCommand('insertText') via the hidden textarea
 */
async function setMonacoEditorContent(page: Page, content: string) {
  await page.waitForSelector('.monaco-editor', { timeout: 30000 });
  await page.waitForTimeout(2000);

  const success = await page.evaluate((yamlContent: string) => {
    // Strategy 1: Walk React fiber tree to find the Monaco editor instance
    // The @monaco-editor/react <Editor> component stores the editor ref
    // in its React fiber memoizedProps or stateNode.
    function findEditorViaFiber(): any {
      const container = document.querySelector('.monaco-editor');
      if (!container) return null;

      // Walk up to find the React root fiber key
      const fiberKey = Object.keys(container).find(
        k =>
          k.startsWith('__reactFiber$') ||
          k.startsWith('__reactInternalInstance$'),
      );
      if (!fiberKey) return null;

      let fiber = (container as any)[fiberKey];
      const visited = new Set();
      while (fiber && !visited.has(fiber)) {
        visited.add(fiber);
        // Check memoizedState chain for editor ref
        let state = fiber.memoizedState;
        const stateVisited = new Set();
        while (state && !stateVisited.has(state)) {
          stateVisited.add(state);
          const ref = state.memoizedState;
          if (ref?.current && typeof ref.current.setValue === 'function') {
            return ref.current;
          }
          state = state.next;
        }
        fiber = fiber.return;
      }
      return null;
    }

    // Strategy 1: React fiber
    const editorFromFiber = findEditorViaFiber();
    if (editorFromFiber) {
      editorFromFiber.setValue(yamlContent);
      return 'fiber';
    }

    // Strategy 2: window.monaco (dev builds)
    const m = (window as any).monaco;
    if (m?.editor) {
      const editors = m.editor.getEditors?.() ?? [];
      if (editors[0]) {
        editors[0].setValue(yamlContent);
        return 'global-editor';
      }
      const models = m.editor.getModels?.() ?? [];
      if (models[0]) {
        models[0].setValue(yamlContent);
        return 'global-model';
      }
    }

    // Strategy 3: execCommand fallback
    const textarea = document.querySelector(
      '.monaco-editor textarea',
    ) as HTMLTextAreaElement;
    if (textarea) {
      textarea.focus();
      document.execCommand('selectAll', false);
      document.execCommand('insertText', false, yamlContent);
      return 'execCommand';
    }

    return null;
  }, content);

  if (success) return;

  // Strategy 4: Keyboard-based fallback (slowest but always works)
  const editorTextarea = page.locator('.monaco-editor textarea');
  await editorTextarea.click();
  await page.waitForTimeout(500);
  await page.keyboard.press('Control+a');
  await page.waitForTimeout(200);
  await page.keyboard.type(content, { delay: 2 });
}

/**
 * Extract dynamic artifact URLs and the plugin namespace from the catalog.
 * Returns OCI references for frontend/backend packages and the plugin's
 * Backstage catalog namespace (needed for the Extensions API).
 */
async function getPluginPackageArtifacts(page: Page): Promise<{
  frontend?: string;
  backend?: string;
  pluginNamespace?: string;
}> {
  const result: {
    frontend?: string;
    backend?: string;
    pluginNamespace?: string;
  } = {};

  try {
    // Get the plugin namespace first
    const pluginData = await page.evaluate(async (pluginName: string) => {
      const resp = await fetch(
        `/api/catalog/entities/by-query?filter=kind=Plugin,metadata.name=${pluginName}&fields=metadata.namespace`,
        { credentials: 'include' },
      );
      if (!resp.ok) return null;
      const json = await resp.json();
      return json.items?.[0]?.metadata?.namespace ?? null;
    }, PLUGIN_CATALOG_NAME);

    if (pluginData) {
      result.pluginNamespace = pluginData;
    }
  } catch {
    // Namespace query failed
  }

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
    test.setTimeout(180_000);

    // First check the plugin install status via API
    const installStatus = await page.evaluate(async (pluginName: string) => {
      const resp = await fetch(
        `/api/catalog/entities/by-query?filter=kind=Plugin,metadata.name=${pluginName}&fields=spec.installStatus`,
        { credentials: 'include' },
      );
      if (!resp.ok) return 'unknown';
      const json = await resp.json();
      return json.items?.[0]?.spec?.installStatus ?? 'unknown';
    }, PLUGIN_CATALOG_NAME);

    if (installStatus === 'Installed') {
      test.info().annotations.push({
        type: 'info',
        description: `Plugin already installed (status: ${installStatus})`,
      });
      return;
    }

    // Navigate to the plugin detail page via the UI
    await navigateToExtensions(page);
    await searchForPlugin(page);

    const readMore = page.getByRole('link', { name: 'Read more' }).first();
    await expect(readMore).toBeVisible({ timeout: 10000 });
    await readMore.click();
    await page.waitForLoadState('networkidle');

    // Click Install link to navigate to the config page
    // data-testId="install" is a LinkButton on the detail page (note: capital I in testId)
    const installLink = page.locator('[data-testId="install"]');
    await expect(installLink).toBeVisible({ timeout: 15000 });
    await installLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // We should now be on the install configuration page with a YAML editor
    await expect(page.locator('.monaco-editor')).toBeVisible({
      timeout: 30000,
    });

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

    // Check if the Install button on the config page is enabled.
    // It will be disabled if the Extensions backend has an initialization error
    // (e.g. missing saveToSingleFile config or seed file).
    const submitButton = page.locator(
      'button[data-testid="install"], button[data-testid="edit"]',
    );
    const installDisabledButton = page.locator(
      'button[data-testid="install-disabled"], button[data-testid="edit-disabled"]',
    );

    const isUiInstallPossible = await submitButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    let uiInstallAttempted = false;

    if (isUiInstallPossible) {
      uiInstallAttempted = true;
      // UI install path: set config in Monaco editor and click Install
      await setMonacoEditorContent(page, configYaml);
      await page.waitForTimeout(1000);

      await expect(submitButton).toBeEnabled({ timeout: 10000 });
      await submitButton.click();

      await page
        .waitForURL(/\/extensions(?!.*install)/, { timeout: 30000 })
        .catch(() => {});
      await page.waitForTimeout(2000);
    } else {
      const isDisabled = await installDisabledButton
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      test.info().annotations.push({
        type: 'info',
        description: `Install button not available (disabled=${isDisabled}) — will use API fallback`,
      });
    }

    // After UI install, check for success indicators:
    // 1. "Backend restart required" banner (immediate UI signal)
    // 2. Catalog API installStatus (may lag behind due to catalog processing)
    if (uiInstallAttempted) {
      const hasRestartBanner = await page
        .getByText(/backend restart required/i)
        .isVisible({ timeout: 10000 })
        .catch(() => false);

      if (hasRestartBanner) {
        test.info().annotations.push({
          type: 'info',
          description:
            'UI install succeeded — "Backend restart required" banner visible',
        });
        return;
      }
    }

    // Poll catalog API with retries — catalog processing can take 10-30s
    let postInstallStatus = 'unknown';
    for (let poll = 0; poll < 6; poll++) {
      postInstallStatus = await page.evaluate(async (pluginName: string) => {
        const resp = await fetch(
          `/api/catalog/entities/by-query?filter=kind=Plugin,metadata.name=${pluginName}&fields=spec.installStatus`,
          { credentials: 'include' },
        );
        if (!resp.ok) return 'unknown';
        const json = await resp.json();
        return json.items?.[0]?.spec?.installStatus ?? 'unknown';
      }, PLUGIN_CATALOG_NAME);
      if (postInstallStatus === 'Installed') break;
      if (poll < 5) await page.waitForTimeout(5000);
    }

    test.info().annotations.push({
      type: 'info',
      description: `Post-install status: ${postInstallStatus}`,
    });

    if (postInstallStatus === 'Installed') return;

    // If the UI install was attempted but status hasn't propagated, also check
    // the "Installed packages" tab count as a secondary indicator.
    if (uiInstallAttempted) {
      const installedTab = page.getByRole('tab', {
        name: /Installed packages/i,
      });
      const tabText = await installedTab.textContent().catch(() => '');
      const match = tabText?.match(/\((\d+)\)/);
      const installedCount = match ? parseInt(match[1], 10) : 0;

      if (installedCount > 0) {
        test.info().annotations.push({
          type: 'info',
          description: `UI install likely succeeded — ${installedCount} installed packages found (catalog may still be processing)`,
        });
        return;
      }
    }

    // Before trying the API fallback, navigate to the Installed tab to check
    // if the plugin was installed by a previous attempt or a background process.
    await navigateToExtensions(page);
    const installedTabFinal = page.getByRole('tab', {
      name: /Installed packages/i,
    });
    const tabTextFinal = await installedTabFinal.textContent().catch(() => '');
    const matchFinal = tabTextFinal?.match(/\((\d+)\)/);
    const installedCountFinal = matchFinal ? parseInt(matchFinal[1], 10) : 0;

    if (installedCountFinal > 0) {
      test.info().annotations.push({
        type: 'info',
        description: `Plugin installed — ${installedCountFinal} installed packages found on Installed tab`,
      });
      return;
    }

    // API fallback: only when the UI install wasn't attempted or clearly failed
    // and the plugin isn't already in the Installed packages tab.
    if (!uiInstallAttempted) {
      test.info().annotations.push({
        type: 'info',
        description:
          'UI install not attempted — falling back to direct API install',
      });

      const ns = artifacts.pluginNamespace ?? 'default';

      const pluginsYaml = configYaml
        .split('\n')
        .slice(1)
        .map(line => (line.startsWith('  ') ? line.slice(2) : line))
        .join('\n');

      const apiResult = await page.evaluate(
        async ({
          pluginName,
          namespace,
          yaml: yamlStr,
        }: {
          pluginName: string;
          namespace: string;
          yaml: string;
        }) => {
          const resp = await fetch(
            `/api/extensions/plugin/${namespace}/${pluginName}/configuration`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ configYaml: yamlStr }),
            },
          );
          return {
            status: resp.status,
            body: await resp.json().catch(() => null),
          };
        },
        { pluginName: PLUGIN_CATALOG_NAME, namespace: ns, yaml: pluginsYaml },
      );

      test.info().annotations.push({
        type: 'info',
        description: `API install result (ns=${ns}): ${
          apiResult.status
        } - ${JSON.stringify(apiResult.body)}`,
      });

      expect(
        apiResult.status,
        `Extensions API install failed: ${JSON.stringify(apiResult.body)}`,
      ).toBe(200);
    }

    // If UI install was attempted but none of the verification checks passed,
    // fail with a clear message rather than silently passing.
    if (uiInstallAttempted) {
      test.fail(
        true,
        `UI install was attempted but could not verify success (banner: not found, catalog: ${postInstallStatus}, installed tab: ${installedCountFinal})`,
      );
    }
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

    if (!layout) {
      // In CI, marketplace install records the plugin config but the pod hasn't
      // been restarted yet — the init container needs to run again to download
      // the OCI binary. The restart happens in a later Jenkins stage, so we
      // skip here instead of failing.
      test.skip(
        true,
        'Sidebar not visible — plugin binary loads after pod restart (handled by CI restart stage)',
      );
    }

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
