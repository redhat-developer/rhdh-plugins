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
import { bootstrapLightspeedRbacE2ePage } from './utils/lightspeedE2eSetup';

async function applyPermissionMatrix(
  page: Page,
  matrix: IaPermissionMatrix,
): Promise<void> {
  await mockIaPermissions(page, matrix);
  await page.goto('/');
}

test.describe('Intelligent assistant permissions', () => {
  test.describe.configure({ mode: 'serial' });

  let sharedPage: Page;
  let permissions: IaRbacPermissionsPage;

  test.beforeAll(async ({ browser }) => {
    const boot = await bootstrapLightspeedRbacE2ePage(
      browser,
      IA_PERMISSIONS_ALL_ALLOWED,
    );
    sharedPage = boot.page;
    permissions = new IaRbacPermissionsPage(sharedPage, boot.translations);
  });

  test.beforeEach(() => {
    permissions.resetApiTracking();
  });

  test.afterEach(async () => {
    await mockIaPermissions(sharedPage, IA_PERMISSIONS_ALL_ALLOWED);
  });

  test('shows FAB and chat and notebooks tabs', async () => {
    await applyPermissionMatrix(sharedPage, {
      chat: true,
      notebooks: true,
      mcp: false,
    });

    await permissions.expectFabVisible();
    await permissions.openFromFab();
    await permissions.expectChatAndNotebooksTabsVisible();
    await expect(permissions.newChatButton()).toBeVisible();
  });

  test('shows FAB without tabs and skips notebook API calls', async () => {
    await applyPermissionMatrix(sharedPage, {
      chat: true,
      notebooks: false,
      mcp: false,
    });

    await permissions.expectFabVisible();
    await permissions.openFromFab();
    await permissions.expectChatOnlyLayout();
  });

  test('shows FAB without tabs and skips chat API calls', async () => {
    await applyPermissionMatrix(sharedPage, {
      chat: false,
      notebooks: true,
      mcp: false,
    });

    await permissions.expectFabVisible();
    await permissions.openFromFab();
    await permissions.expectNotebooksOnlyLayout();
  });

  test('hides FAB', async () => {
    await applyPermissionMatrix(sharedPage, {
      chat: false,
      notebooks: false,
      mcp: false,
    });

    await permissions.expectFabHidden();
  });

  test('shows MCP settings in header menu', async () => {
    await permissions.expectMcpMenuVisible();
  });

  test('hides MCP settings from header menu', async () => {
    await applyPermissionMatrix(sharedPage, {
      ...IA_PERMISSIONS_ALL_ALLOWED,
      mcp: false,
    });

    await permissions.expectMcpMenuHidden();
  });
});
