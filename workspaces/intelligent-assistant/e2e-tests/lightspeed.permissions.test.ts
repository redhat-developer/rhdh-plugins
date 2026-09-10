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

import { test, expect, type Page } from '@playwright/test';

import { IaRbacPermissionsPage } from './pages/IaRbacPermissionsPage';
import {
  IA_PERMISSIONS_ALL_ALLOWED,
  mockIaPermissions,
  type IaPermissionMatrix,
} from './utils/devMode';
import { skipUnlessLocales } from './utils/localeSkip';
import { bootstrapLightspeedRbacE2ePage } from './utils/lightspeedE2eSetup';

async function bootstrapPermissionScenario(
  browser: Parameters<typeof bootstrapLightspeedRbacE2ePage>[0],
  matrix: IaPermissionMatrix,
): Promise<{ page: Page; permissions: IaRbacPermissionsPage }> {
  const boot = await bootstrapLightspeedRbacE2ePage(browser, matrix);
  return {
    page: boot.page,
    permissions: new IaRbacPermissionsPage(boot.page, boot.translations),
  };
}

test.describe('Intelligent assistant permissions', () => {
  test.beforeAll(({}, testInfo) => {
    skipUnlessLocales(
      testInfo,
      ['en'],
      'RBAC permission gating is locale-independent',
    );
  });

  test.describe('Chat and notebooks', () => {
    let sharedPage: Page;
    let permissions: IaRbacPermissionsPage;

    test.beforeAll(async ({ browser }) => {
      const boot = await bootstrapPermissionScenario(browser, {
        chat: true,
        notebooks: true,
        mcp: false,
      });
      sharedPage = boot.page;
      permissions = boot.permissions;
    });

    test.beforeEach(async () => {
      await sharedPage.goto('/');
    });

    test('shows FAB and chat and notebooks tabs', async () => {
      await permissions.expectFabVisible();
      await permissions.openFromFab();
      await permissions.expectChatAndNotebooksTabsVisible();
      await expect(permissions.newChatButton()).toBeVisible();
    });
  });

  test.describe('Chat only', () => {
    let sharedPage: Page;
    let permissions: IaRbacPermissionsPage;

    test.beforeAll(async ({ browser }) => {
      const boot = await bootstrapPermissionScenario(browser, {
        chat: true,
        notebooks: false,
        mcp: false,
      });
      sharedPage = boot.page;
      permissions = boot.permissions;
    });

    test.beforeEach(async () => {
      permissions.resetApiTracking();
      await sharedPage.goto('/');
    });

    test('shows FAB without tabs and skips notebook API calls', async () => {
      await permissions.expectFabVisible();
      await permissions.openFromFab();
      await permissions.expectChatOnlyLayout();
    });
  });

  test.describe('Notebooks only', () => {
    let sharedPage: Page;
    let permissions: IaRbacPermissionsPage;

    test.beforeAll(async ({ browser }) => {
      const boot = await bootstrapPermissionScenario(browser, {
        chat: false,
        notebooks: true,
        mcp: false,
      });
      sharedPage = boot.page;
      permissions = boot.permissions;
    });

    test.beforeEach(async () => {
      permissions.resetApiTracking();
      await sharedPage.goto('/');
    });

    test('shows FAB without tabs and skips chat API calls', async () => {
      await permissions.expectFabVisible();
      await permissions.openFromFab();
      await permissions.expectNotebooksOnlyLayout();
    });
  });

  test.describe('No chat or notebooks', () => {
    let sharedPage: Page;
    let permissions: IaRbacPermissionsPage;

    test.beforeAll(async ({ browser }) => {
      const boot = await bootstrapPermissionScenario(browser, {
        chat: false,
        notebooks: false,
        mcp: false,
      });
      sharedPage = boot.page;
      permissions = boot.permissions;
    });

    test.beforeEach(async () => {
      await sharedPage.goto('/');
    });

    test('hides FAB', async () => {
      await permissions.expectFabHidden();
    });
  });

  test.describe('MCP tools', () => {
    test.describe.configure({ mode: 'serial' });

    let sharedPage: Page;
    let permissions: IaRbacPermissionsPage;

    test.beforeAll(async ({ browser }) => {
      const boot = await bootstrapPermissionScenario(
        browser,
        IA_PERMISSIONS_ALL_ALLOWED,
      );
      sharedPage = boot.page;
      permissions = boot.permissions;
    });

    test.beforeEach(async () => {
      await sharedPage.goto('/');
    });

    test.afterEach(async () => {
      await mockIaPermissions(sharedPage, IA_PERMISSIONS_ALL_ALLOWED);
    });

    test('shows MCP settings in header menu', async () => {
      await permissions.expectMcpMenuVisible();
    });

    test('hides MCP settings from header menu', async () => {
      await mockIaPermissions(sharedPage, {
        ...IA_PERMISSIONS_ALL_ALLOWED,
        mcp: false,
      });
      await sharedPage.goto('/');

      await permissions.expectMcpMenuHidden();
    });
  });
});
