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

import { expect, test, type TestInfo } from '@playwright/test';

import {
  mockBulkImportRepositoriesResponse,
  mockBulkImportSCMHostsResponse,
  mockRepositoriesData,
  mockSCMHostsData,
} from './utils/apiUtils';
import {
  installMockBulkImportPermission,
  loginAsGuest,
} from './utils/permissionUtils';
import { getBulkImportNavLabel, getTranslations } from './utils/translations';

const isLegacy = process.env.APP_MODE === 'legacy';

function getLocaleContext(testInfo: TestInfo) {
  const locale = testInfo.project.name;
  const translations = getTranslations(locale);
  const bulkImportNavLabel = getBulkImportNavLabel(locale);

  return { locale, translations, bulkImportNavLabel };
}

test.describe('Bulk Import permissions', () => {
  test('shows bulk import in the sidebar when bulk.import is allowed', async ({
    page,
  }, testInfo) => {
    const { locale, bulkImportNavLabel } = getLocaleContext(testInfo);

    await installMockBulkImportPermission(page, 'ALLOW');
    await loginAsGuest(page, locale);

    await expect(
      page.getByRole('link', { name: bulkImportNavLabel }),
    ).toBeVisible();
  });

  test('hides bulk import from the sidebar when bulk.import is denied', async ({
    page,
  }, testInfo) => {
    const { locale, bulkImportNavLabel } = getLocaleContext(testInfo);

    await installMockBulkImportPermission(page, 'DENY');
    await loginAsGuest(page, locale);

    await expect(
      page.getByRole('link', { name: bulkImportNavLabel }),
    ).not.toBeVisible();
  });

  test('opens the bulk import page when bulk.import is allowed', async ({
    page,
  }, testInfo) => {
    const { locale, translations, bulkImportNavLabel } =
      getLocaleContext(testInfo);

    await installMockBulkImportPermission(page, 'ALLOW');
    await mockBulkImportSCMHostsResponse(page, mockSCMHostsData);
    await mockBulkImportRepositoriesResponse(page, mockRepositoriesData);
    await loginAsGuest(page, locale);

    await page.getByRole('link', { name: bulkImportNavLabel }).click();

    await expect(
      page.getByText(translations.addRepositories.approvalTool.title),
    ).toBeVisible();
  });

  test('denies direct navigation to bulk import when bulk.import is denied', async ({
    page,
  }, testInfo) => {
    const { locale, translations, bulkImportNavLabel } =
      getLocaleContext(testInfo);

    await installMockBulkImportPermission(page, 'DENY');
    await loginAsGuest(page, locale);

    // Fresh navigation resets NFS if-predicate session state (per test page).
    await page.goto('/bulk-import');
    await page.waitForLoadState('networkidle');

    if (isLegacy) {
      await expect(page.getByTestId('no-permission-alert')).toBeVisible();
      await expect(
        page.getByText(translations.permissions.addRepositoriesMessage),
      ).toBeVisible();
      return;
    }

    await expect(
      page.getByText(translations.addRepositories.approvalTool.title),
    ).not.toBeVisible();
    await expect(
      page.getByRole('link', { name: bulkImportNavLabel }),
    ).not.toBeVisible();
  });
});
