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

import { BrowserContext, Page, expect, test, TestInfo } from '@playwright/test';

import {
  mockBulkImportByRepoFrontendResponse,
  mockBulkImportByRepoResponse,
  mockBulkImportDryRunResponse,
  mockBulkImportImportsResponse,
  mockBulkImportRepositoriesResponse,
  mockBulkImportSCMHostsResponse,
  mockImportByRepoData,
  mockImportByRepoFrontendData,
  mockImportsData,
  mockImportsDryRunData,
  mockRepositoriesData,
  mockSCMHostsData,
} from './utils/apiUtils';
import { getFullPreviewSidebarSnapshot } from './utils/ariaSnapshots';
import {
  runAccessibilityTests,
  setBuiCheckbox,
  switchToLocale,
} from './utils/helpers';
import { installMockBulkImportPermission } from './utils/permissionUtils';
import {
  BulkImportMessages,
  getBulkImportNavLabel,
  getSelectedRepositoriesHeading,
  getTranslations,
} from './utils/translations';

test.describe('Bulk Import', () => {
  test.describe.configure({ mode: 'serial' });

  let sharedPage: Page;
  let translations: BulkImportMessages;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    sharedPage = await context.newPage();

    // The backend's GET /repositories and GET /organizations/{org}/repositories
    // endpoints require the X-SCM-Tokens header (HTTP 401 otherwise). In a real
    // deployment, the frontend obtains these tokens from the configured GitHub /
    // GitLab OAuth provider via ScmAuthApi and sends them with every listing
    // request. See plugins/bulk-import/README.md → "Required OAuth Configuration".
    //
    // In these e2e tests we bypass that requirement in two steps:
    //   1. Mock GET /api/bulk-import/scm-hosts to return empty host arrays.
    //      The useRepositories hook hits the `!urls?.length → return undefined`
    //      early-return path, so tokenFetchError stays undefined and the query
    //      fires without any X-SCM-Tokens header.
    //   2. Mock GET /api/bulk-import/repositories* with a 200 response so
    //      Playwright intercepts the token-free request before it ever reaches
    //      the real backend's 401 guard.
    //
    // This lets us focus on UI behaviour without needing a real OAuth provider
    // set up in the test environment.
    await installMockBulkImportPermission(sharedPage, 'ALLOW');
    await mockBulkImportSCMHostsResponse(sharedPage, mockSCMHostsData);
    await mockBulkImportRepositoriesResponse(sharedPage, mockRepositoriesData);
    await sharedPage.goto('/');

    const enterButton = sharedPage.getByRole('button', { name: 'Enter' });
    await expect(enterButton).toBeVisible();
    await enterButton.click();

    const currentLocale = await sharedPage.evaluate(
      () => globalThis.navigator.language,
    );

    // Wait for catalog to load BEFORE switching locale
    // This ensures catalog is loaded in English, then we switch locale
    const maxRetries = 3;
    const waitTimeout = 5000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Wait for the sidebar to be visible before navigating
        await expect(sharedPage.getByText('My Company Catalog')).toBeVisible();
        // Wait for catalog to load - use English text since we haven't switched locale yet
        await expect(sharedPage.getByText('All Components')).toBeVisible({
          timeout: waitTimeout,
        });

        break; // nice catalog loaded
      } catch (error) {
        if (attempt === maxRetries) {
          const html = await sharedPage.content();
          throw new Error(
            `Catalog not loaded after ${maxRetries} retries. Error: ${error}. HTML snapshot: ${html}`,
          );
        }

        await sharedPage.reload();
        await expect(sharedPage.getByText('All Components')).toBeVisible({
          timeout: 30000,
        });
      }
    }

    // Now switch locale AFTER catalog is loaded
    await switchToLocale(sharedPage, currentLocale);
    translations = getTranslations(currentLocale);
    const bulkImportNavLabel = getBulkImportNavLabel(currentLocale);
    await expect(
      sharedPage.getByRole('link', { name: bulkImportNavLabel }),
    ).toBeVisible();
    await sharedPage.getByRole('link', { name: bulkImportNavLabel }).click();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should render bulk import page with source control options, search, and repositories table', async ({
    browser,
  }, testInfo: TestInfo) => {
    const addRepositoriesPanel = sharedPage.getByTestId(
      'add-repositories-table-panel',
    );

    await expect(addRepositoriesPanel).toMatchAriaSnapshot(`
      - text: ${translations.addRepositories.approvalTool.title}
      - img
      - radiogroup:
        - radio "${translations.addRepositories.approvalTool.github}" [checked]
        - text: ${translations.addRepositories.approvalTool.github}
        - radio "${translations.addRepositories.approvalTool.gitlab}"
        - text: ${translations.addRepositories.approvalTool.gitlab}
      `);

    const selectedReposHeading = getSelectedRepositoriesHeading(
      translations,
      0,
    );
    await expect(addRepositoriesPanel).toMatchAriaSnapshot(`
      - heading "${selectedReposHeading}" [level=2]
      - searchbox "search"
      `);

    await expect(addRepositoriesPanel).toMatchAriaSnapshot(`
      - table:
        - rowgroup:
          - row "select all repositories ${translations.table.headers.name} ${translations.table.headers.url} ${translations.table.headers.organization} ${translations.table.headers.status}":
            - columnheader "select all repositories ${translations.table.headers.name}":
              - checkbox "select all repositories"
              - text: ${translations.table.headers.name}
            - columnheader "${translations.table.headers.url}"
            - columnheader "${translations.table.headers.organization}"
            - columnheader "${translations.table.headers.status}"
      `);

    await runAccessibilityTests(sharedPage, testInfo);
  });

  test('Verify selected repositories count change', async () => {
    const selectAllCheckbox = sharedPage.getByRole('checkbox', {
      name: 'select all repositories',
    });
    const headingId = `${translations.addRepositories.selectedLabel} ${translations.addRepositories.selectedRepositories}`;
    const selectedReposHeading = sharedPage.locator(`[id="${headingId}"]`);

    const zeroSelected = getSelectedRepositoriesHeading(translations, 0);
    const fiveSelected = getSelectedRepositoriesHeading(translations, 5);

    await expect(selectedReposHeading).toContainText(zeroSelected);
    await expect(selectAllCheckbox).toBeEnabled();
    await setBuiCheckbox(sharedPage, 'select all repositories', true);
    await expect(selectAllCheckbox).toBeChecked();
    await expect(selectedReposHeading).toContainText(fiveSelected);
    const readyToImport = await sharedPage
      .getByText(translations.status.readyToImport)
      .count();
    expect(readyToImport).toEqual(5);
    await setBuiCheckbox(sharedPage, 'select all repositories', false);
    await expect(selectAllCheckbox).not.toBeChecked();
  });

  test('Verify preview sidebar', async ({ browser }, testInfo: TestInfo) => {
    const backendServiceCheckbox = sharedPage.getByRole('checkbox', {
      name: 'select backend-service',
    });
    const sidebar = sharedPage.getByTestId('preview-pullrequest-sidebar');

    await expect(backendServiceCheckbox).toBeEnabled();
    await setBuiCheckbox(sharedPage, 'select backend-service', true);
    await expect(backendServiceCheckbox).toBeChecked();
    await expect(
      sharedPage.getByText(translations.status.readyToImport).first(),
    ).toBeVisible();
    await mockBulkImportByRepoResponse(sharedPage, mockImportByRepoData);
    await sharedPage.getByTestId('preview-file').first().click();

    // Wait for sidebar to be fully visible and loaded
    await expect(sidebar).toBeVisible();
    const previewForm = sidebar.getByTestId('preview-pull-request-form');
    await expect(previewForm).toBeVisible();
    await expect(sidebar.getByRole('heading', { level: 2 })).toContainText(
      'backend-service',
    );
    await expect(sidebar).toMatchAriaSnapshot(`
      - button "${translations.common.save}"
      - button "${translations.common.cancel}"
      `);

    await expect(previewForm).toMatchAriaSnapshot(
      getFullPreviewSidebarSnapshot(translations, testInfo.project.name),
    );

    await runAccessibilityTests(sharedPage, testInfo);

    await sidebar
      .getByRole('button', { name: translations.common.cancel })
      .click();
  });

  test('Verify Import flow', async ({}, testInfo) => {
    const backendServiceCheckbox = sharedPage.getByRole('checkbox', {
      name: 'select backend-service',
    });
    const frontendAppCheckbox = sharedPage.getByRole('checkbox', {
      name: 'select frontend-app',
    });
    const addRepoFooter = sharedPage.getByTestId('add-repository-footer');

    await mockBulkImportDryRunResponse(sharedPage, mockImportsDryRunData);
    await mockBulkImportImportsResponse(sharedPage, mockImportsData);
    await mockBulkImportByRepoResponse(sharedPage, mockImportByRepoData);
    await mockBulkImportByRepoFrontendResponse(
      sharedPage,
      mockImportByRepoFrontendData,
    );
    await expect(backendServiceCheckbox).toBeEnabled();
    await setBuiCheckbox(sharedPage, 'select backend-service', true);
    await expect(backendServiceCheckbox).toBeChecked();
    await expect(frontendAppCheckbox).toBeEnabled();
    await setBuiCheckbox(sharedPage, 'select frontend-app', true);
    await expect(frontendAppCheckbox).toBeChecked();
    await expect(addRepoFooter).toMatchAriaSnapshot(`
      - button "${translations.common.import}"
      - link "${translations.common.cancel}":
        - /url: /bulk-import
        - button "${translations.common.cancel}"
      `);
    await sharedPage
      .getByTestId('add-repository-footer')
      .getByRole('button', { name: translations.common.import })
      .click();
    await expect(
      sharedPage
        .locator('tbody')
        .getByText(translations.status.imported, { exact: true }),
    ).toBeVisible();
    await expect(sharedPage.locator('tbody')).toMatchAriaSnapshot(`
      - cell "${translations.status.waitingForApproval} ${translations.repositories.pr} , Opens in a new window":
        - link "${translations.repositories.pr} , Opens in a new window":
          - /url: https://github.com/test-org/frontend-app/pull/1
      `);
  });

  test('test rows dropdown', async () => {
    await sharedPage
      .getByRole('button', {
        name: `${translations.table.pagination.rows5} Select table page size`,
      })
      .click();
    await expect(sharedPage.getByRole('listbox')).toMatchAriaSnapshot(`
      - listbox:
        - option "${translations.table.pagination.rows5}"
        - option "${translations.table.pagination.rows10}"
        - option "${translations.table.pagination.rows20}"
        - option "${translations.table.pagination.rows50}"
        - option "${translations.table.pagination.rows100}"
      `);
    await sharedPage.keyboard.press('Escape');
  });
});
