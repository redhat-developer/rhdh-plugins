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
  mockImportByRepoData,
  mockImportByRepoFrontendData,
  mockImportsData,
  mockImportsDryRunData,
  mockRepositoriesData,
} from './utils/apiUtils';
import {
  getPreviewSidebarSnapshots,
  PreviewSidebarSnapshotsType,
} from './utils/ariaSnapshots';
import { runAccessibilityTests, switchToLocale } from './utils/helpers';
import {
  BulkImportMessages,
  getSelectedRepositoriesHeading,
  getTranslations,
} from './utils/translations';

test.describe('Bulk Import', () => {
  test.describe.configure({ mode: 'serial' });

  let sharedPage: Page;
  let translations: BulkImportMessages;
  let previewSidebarSnapshots: PreviewSidebarSnapshotsType;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    sharedPage = await context.newPage();

    // Handle guest authentication dialog
    // TODO - Remove it after https://issues.redhat.com/browse/RHIDP-2043
    sharedPage.on('dialog', async dialog => {
      await dialog.accept();
    });

    await mockBulkImportRepositoriesResponse(sharedPage, mockRepositoriesData);
    await sharedPage.goto('/');

    const enterButton = sharedPage.getByRole('button', { name: 'Enter' });
    await expect(enterButton).toBeVisible();
    await enterButton.click();

    // Wait for authentication to complete - wait for sidebar or main content to appear
    await sharedPage.waitForLoadState('networkidle');
    // Additional wait to ensure auth state is fully initialized
    await sharedPage.waitForTimeout(500);

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
        await expect(sharedPage.getByText('All Components (1)')).toBeVisible({
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
        await sharedPage.waitForLoadState('networkidle');
      }
    }

    // Now switch locale AFTER catalog is loaded
    await switchToLocale(sharedPage, currentLocale);
    translations = getTranslations(currentLocale);
    previewSidebarSnapshots = getPreviewSidebarSnapshots(translations);

    await expect(
      sharedPage.getByRole('link', { name: translations.sidebar.bulkImport }),
    ).toBeVisible();
    await sharedPage
      .getByRole('link', { name: translations.sidebar.bulkImport })
      .click();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should render bulk import page with source control options, search, and repositories table', async ({
    browser,
  }, testInfo: TestInfo) => {
    const article = sharedPage.getByRole('article');

    await expect(article).toMatchAriaSnapshot(`
      - paragraph: ${translations.addRepositories.approvalTool.title}
      - paragraph
      - radiogroup:
        - radio "${translations.addRepositories.approvalTool.github}"
        - text: ${translations.addRepositories.approvalTool.github}
        - radio "${translations.addRepositories.approvalTool.gitlab}"
        - text: ${translations.addRepositories.approvalTool.gitlab}
      `);

    const selectedReposHeading = getSelectedRepositoriesHeading(
      translations,
      0,
    );
    await expect(article).toMatchAriaSnapshot(`
      - heading "${selectedReposHeading}"
      - textbox "search"
      - button "${translations.addRepositories.clearSearch}" 
      `);

    await expect(article).toMatchAriaSnapshot(`
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
    await selectAllCheckbox.check();
    await expect(selectAllCheckbox).toBeChecked();
    await expect(selectedReposHeading).toContainText(fiveSelected);
    const readyToImport = await sharedPage
      .getByText(translations.status.readyToImport)
      .count();
    expect(readyToImport).toEqual(5);
    await selectAllCheckbox.uncheck();
    await expect(selectAllCheckbox).not.toBeChecked();
  });

  test('Verify preview sidebar', async ({ browser }, testInfo: TestInfo) => {
    const backendServiceCheckbox = sharedPage
      .getByRole('rowheader', { name: 'backend-service' })
      .getByRole('checkbox');
    const sidebar = sharedPage.getByTestId('preview-pullrequest-sidebar');

    await backendServiceCheckbox.check();
    await expect(
      sharedPage.getByText(translations.status.readyToImport).first(),
    ).toBeVisible();
    await sharedPage.getByTestId('preview-file').first().click();

    // Wait for sidebar to be fully visible and loaded
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator('h5')).toContainText('backend-service');
    await expect(sidebar).toMatchAriaSnapshot(`
      - button "${translations.common.save}"
      - link "${translations.common.cancel}":
        - /url: /bulk-import/repositories
        - button "${translations.common.cancel}"
      `);

    // Validate each section individually for better readability
    await expect(sidebar).toMatchAriaSnapshot(
      previewSidebarSnapshots.pullRequestDetails,
    );
    await expect(sidebar).toMatchAriaSnapshot(
      previewSidebarSnapshots.entityConfigHeader,
    );
    await expect(sidebar).toMatchAriaSnapshot(
      previewSidebarSnapshots.entityOwner,
    );
    await expect(sidebar).toMatchAriaSnapshot(
      previewSidebarSnapshots.codeownersOption,
    );
    await expect(sidebar).toMatchAriaSnapshot(
      previewSidebarSnapshots.annotations,
    );
    await expect(sidebar).toMatchAriaSnapshot(previewSidebarSnapshots.labels);
    await expect(sidebar).toMatchAriaSnapshot(previewSidebarSnapshots.spec);
    await expect(sidebar).toMatchAriaSnapshot(
      previewSidebarSnapshots.previewPullRequest,
    );
    await expect(sidebar).toMatchAriaSnapshot(
      previewSidebarSnapshots.previewEntities,
    );

    await runAccessibilityTests(sharedPage, testInfo);

    await sharedPage
      .getByRole('button', { name: translations.common.cancel })
      .click();
  });

  test('Verify Import flow', async () => {
    const backendServiceCheckbox = sharedPage
      .getByRole('rowheader', { name: 'backend-service' })
      .getByRole('checkbox');
    const frontendAppCheckbox = sharedPage
      .getByRole('rowheader', { name: 'frontend-app' })
      .getByRole('checkbox');
    const addRepoFooter = sharedPage.getByTestId('add-repository-footer');

    await mockBulkImportDryRunResponse(sharedPage, mockImportsDryRunData);
    await mockBulkImportImportsResponse(sharedPage, mockImportsData);
    await mockBulkImportByRepoResponse(sharedPage, mockImportByRepoData);
    await mockBulkImportByRepoFrontendResponse(
      sharedPage,
      mockImportByRepoFrontendData,
    );
    await backendServiceCheckbox.check();
    await frontendAppCheckbox.check();
    await expect(addRepoFooter).toMatchAriaSnapshot(`
      - button "${translations.common.import}"
      - link "${translations.common.cancel}":
        - /url: /bulk-import/repositories
        - button "${translations.common.cancel}"
      `);
    await sharedPage
      .getByTestId('add-repository-footer')
      .getByRole('button', { name: translations.common.import })
      .click();
    await expect(
      sharedPage.getByText(translations.status.imported),
    ).toBeVisible();
    await expect(sharedPage.locator('tbody')).toMatchAriaSnapshot(`
      - cell "${translations.status.waitingForApproval} ${translations.repositories.pr} , Opens in a new window":
        - link "${translations.repositories.pr} , Opens in a new window":
          - /url: https://github.com/test-org/frontend-app/pull/1
      `);
  });

  test('test rows dropdown', async () => {
    await sharedPage
      .getByRole('combobox', { name: translations.table.pagination.rows5 })
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
