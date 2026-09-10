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

import { expect, Page } from '@playwright/test';

import { switchToLocale } from './helpers';

export const BULK_IMPORT_PERMISSION_NAME = 'bulk.import';

type AuthorizeItem = {
  id: string;
  permission?: {
    name?: string;
  };
};

type AuthorizeRequestBody = {
  items?: AuthorizeItem[];
};

/**
 * Mocks /api/permission/authorize for bulk.import while leaving other
 * permission checks to the real backend.
 *
 * bulk.import is user-scoped (not per catalog entity), so we control allow/deny
 * here instead of using multiple catalog entities like entity-scoped plugins.
 */
export async function installMockBulkImportPermission(
  page: Page,
  result: 'ALLOW' | 'DENY',
) {
  await page.route('**/api/permission/authorize', async route => {
    const request = route.request();
    if (request.method() !== 'POST') {
      await route.continue();
      return;
    }

    let body: AuthorizeRequestBody;
    try {
      body = request.postDataJSON() as AuthorizeRequestBody;
    } catch {
      await route.continue();
      return;
    }

    const items = body.items ?? [];
    const affectsBulkImport = items.some(
      item => item.permission?.name === BULK_IMPORT_PERMISSION_NAME,
    );

    if (!affectsBulkImport) {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: items.map(item => ({
          id: item.id,
          result:
            item.permission?.name === BULK_IMPORT_PERMISSION_NAME
              ? result
              : 'ALLOW',
        })),
      }),
    });
  });
}

/** Sign in as guest, switch to the project locale, and wait for the catalog. */
export async function loginAsGuest(page: Page, locale: string) {
  await page.goto('/');
  const enterButton = page.getByRole('button', { name: 'Enter' });
  await expect(enterButton).toBeVisible();
  await enterButton.click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('All Components')).toBeVisible();
  await switchToLocale(page, locale);
}
