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

import { test, expect, type Browser, type Page } from '@playwright/test';

import { IaRbacPermissionsPage } from './pages/IaRbacPermissionsPage';
import {
  IA_PERMISSIONS_ALL_ALLOWED,
  waitForIaPermissionAuthorize,
  type IaPermissionMatrix,
} from './utils/devMode';
import { skipUnlessLocales } from './utils/localeSkip';
import { bootstrapLightspeedRbacE2ePage } from './utils/lightspeedE2eSetup';

async function withPermissionScenario(
  browser: Browser,
  matrix: IaPermissionMatrix,
  run: (page: Page, permissions: IaRbacPermissionsPage) => Promise<void>,
): Promise<void> {
  const boot = await bootstrapLightspeedRbacE2ePage(browser, matrix);
  const permissions = new IaRbacPermissionsPage(boot.page, boot.translations);
  try {
    await boot.page.goto('/');
    await waitForIaPermissionAuthorize(boot.page).catch(() => undefined);
    await run(boot.page, permissions);
  } finally {
    await boot.page.context().close();
  }
}

test.describe('Intelligent assistant permissions', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(({}, testInfo) => {
    skipUnlessLocales(
      testInfo,
      ['en'],
      'RBAC permission gating is locale-independent',
    );
  });

  test('shows FAB and chat and notebooks tabs', async ({ browser }) => {
    await withPermissionScenario(
      browser,
      { chat: true, notebooks: true, mcp: false },
      async (_page, permissions) => {
        await permissions.expectFabVisible();
        await permissions.openFromFab();
        await permissions.expectChatAndNotebooksTabsVisible();
        await expect(permissions.newChatButton()).toBeVisible();
      },
    );
  });

  test('shows chat-only layout without notebooks tab', async ({ browser }) => {
    await withPermissionScenario(
      browser,
      { chat: true, notebooks: false, mcp: false },
      async (_page, permissions) => {
        await permissions.expectFabVisible();
        await permissions.openFromFab();
        await permissions.expectChatOnlyLayout();
      },
    );
  });

  test('shows notebooks-only layout without chat tab', async ({ browser }) => {
    await withPermissionScenario(
      browser,
      { chat: false, notebooks: true, mcp: false },
      async (_page, permissions) => {
        await permissions.expectFabVisible();
        await permissions.openFromFab();
        await permissions.expectNotebooksOnlyLayout();
      },
    );
  });

  test('hides FAB when chat and notebooks are denied', async ({ browser }) => {
    await withPermissionScenario(
      browser,
      { chat: false, notebooks: false, mcp: false },
      async (_page, permissions) => {
        await permissions.expectFabHidden();
      },
    );
  });

  test('shows MCP settings in header menu when allowed', async ({
    browser,
  }) => {
    await withPermissionScenario(
      browser,
      IA_PERMISSIONS_ALL_ALLOWED,
      async (_page, permissions) => {
        await permissions.expectMcpMenuVisible();
      },
    );
  });

  test('hides MCP settings from header menu when denied', async ({
    browser,
  }) => {
    await withPermissionScenario(
      browser,
      { ...IA_PERMISSIONS_ALL_ALLOWED, mcp: false },
      async (_page, permissions) => {
        await permissions.expectMcpMenuHidden();
      },
    );
  });
});
