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

import {
  NotebookSurfacePage,
  NOTEBOOK_UNTITLED_GRID_NAME,
} from './pages/NotebookSurfacePage';
import type { LightspeedMessages } from './utils/translations';
import { bootstrapLightspeedE2ePage } from './utils/lightspeedE2eSetup';
import {
  openChatbot,
  selectDisplayMode,
  type DisplayMode,
} from './pages/LightspeedPage';
import {
  localeNotebookUpload1Path,
  NOTEBOOK_SESSION_MAX_DOCUMENTS,
} from './utils/notebooks';

async function switchToCompactNotebooks(
  page: Page,
  t: LightspeedMessages,
  mode: DisplayMode,
) {
  await page.goto('/');
  await openChatbot(page, t);
  await selectDisplayMode(page, t, mode);
  await page.getByRole('tab', { name: t['tabs.notebooks'] }).click();
}

for (const mode of ['Overlay', 'Dock to window'] as const) {
  test.describe(`Notebooks in ${mode} mode`, () => {
    test.describe.configure({ mode: 'serial' });

    let sharedPage: Page;
    let translations: LightspeedMessages;
    let notebooks: NotebookSurfacePage;

    test.beforeAll(async ({ browser }) => {
      const boot = await bootstrapLightspeedE2ePage(browser);
      sharedPage = boot.page;
      translations = boot.translations;
      notebooks = new NotebookSurfacePage(
        sharedPage,
        translations,
        boot.locale,
      );
    });

    test('tabs are visible and notebooks tab selectable', async () => {
      await switchToCompactNotebooks(sharedPage, translations, mode);

      await expect(notebooks.chatTab()).toBeVisible();
      await expect(notebooks.notebooksTab()).toBeVisible();
      await expect(notebooks.notebooksTab()).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    test('empty notebook list shows create action', async () => {
      await notebooks.expectNotebookListHeaderControlsVisible();
    });

    test('create notebook and verify compact editor layout', async () => {
      await notebooks.clickCreateNotebookFromEmptyList();

      await expect(notebooks.uploadResourceHeading()).toBeVisible();
      await expect(notebooks.uploadResourceActionButton()).toBeVisible();
    });

    test('header actions visible in compact mode: close, add, sidebar toggle', async () => {
      await notebooks.expectCompactHeaderActionsVisible();
    });

    test('NotebookView topBar close button hidden in compact mode', async () => {
      await notebooks.expectSingleNotebookCloseButton();
    });

    test('upload modal opens and renders within panel', async () => {
      await notebooks.clickCompactHeaderAddDocument();

      const uploadModal = notebooks.uploadDocumentModal();
      await expect(uploadModal.dialog()).toBeVisible({ timeout: 10_000 });
      await uploadModal.expectUploadAreaFullyDescribed();
      await uploadModal.dismiss();
    });

    test('sidebar toggle mirrors icon direction', async () => {
      await notebooks.toggleCompactSidebarAndExpectLabelFlip();
    });

    test('file picker works in compact upload modal', async ({}, testInfo) => {
      const { absolutePath } = localeNotebookUpload1Path(testInfo.project.name);

      await notebooks.clickCompactHeaderAddDocument();
      const uploadModal = notebooks.uploadDocumentModal();
      await expect(uploadModal.dialog()).toBeVisible({ timeout: 10_000 });
      await uploadModal.selectFilesViaBrowsePicker([absolutePath]);
      await uploadModal.expectStagedFileCountCaptionVisible(
        1,
        NOTEBOOK_SESSION_MAX_DOCUMENTS,
      );
      await uploadModal.clickCancel();
    });

    test('header add: upload completes and resource appears in panel', async ({}, testInfo) => {
      const { absolutePath, fileName } = localeNotebookUpload1Path(
        testInfo.project.name,
      );

      await notebooks.clickCompactHeaderAddDocument();
      const uploadModal = notebooks.uploadDocumentModal();
      await uploadModal.selectFilesViaBrowsePicker([absolutePath]);
      await uploadModal.clickAddFilesForStagedCount(1);
      await notebooks.ensureDocumentSidebarExpanded();
      await notebooks.expectDocumentFileListedInSidebar(fileName);
    });

    test('remove resource modal renders within panel', async () => {
      await notebooks.ensureDocumentSidebarExpanded();
      await notebooks.openDeleteFirstDocumentConfirmation();
      await notebooks.cancelDeleteDocumentConfirmation();
      await notebooks.deleteFirstListedDocumentFromSidebarOverflowMenu();
      await notebooks.expectNotebookEditorUploadResourceButtonVisible();
    });

    test('switch tabs preserves notebook state', async () => {
      await notebooks.chatTab().click();
      await expect(notebooks.chatTab()).toHaveAttribute(
        'aria-selected',
        'true',
      );

      await notebooks.notebooksTab().click();
      await expect(notebooks.notebooksTab()).toHaveAttribute(
        'aria-selected',
        'true',
      );

      await expect(notebooks.uploadResourceHeading()).toBeVisible();
    });

    test('close notebook via header action', async () => {
      await notebooks.clickCompactHeaderCloseNotebook();

      await expect(notebooks.myNotebooksHeading()).toBeVisible();
      await expect(
        notebooks.createNotebookFromEmptyStateButton(),
      ).toBeVisible();
    });

    test('display mode switch preserves notebooks tab', async () => {
      const otherMode: DisplayMode =
        mode === 'Overlay' ? 'Dock to window' : 'Overlay';

      await selectDisplayMode(sharedPage, translations, otherMode);

      await expect(notebooks.notebooksTab()).toHaveAttribute(
        'aria-selected',
        'true',
      );
      await expect(notebooks.myNotebooksHeading()).toBeVisible();
    });

    test('switch to fullscreen preserves notebooks tab', async () => {
      await selectDisplayMode(sharedPage, translations, 'Fullscreen');

      await expect(notebooks.notebooksTab()).toBeVisible();
    });

    test('cleanup: delete notebook modal renders within panel', async () => {
      await selectDisplayMode(sharedPage, translations, mode);
      await notebooks.notebooksTab().click();

      const card = notebooks.newestUntitledNotebookCard();
      if ((await card.count()) === 0) {
        return;
      }

      await notebooks.notebookCardOverflowMenuButton(card).click();
      await notebooks.deleteNotebookOverflowMenuItem().click();

      const confirmDelete = notebooks.notebookDeleteConfirmationDialog(
        NOTEBOOK_UNTITLED_GRID_NAME,
      );
      await confirmDelete.expectDialogVisible();
      await notebooks.expectNotebookDeleteDialogWithinChatbot(
        NOTEBOOK_UNTITLED_GRID_NAME,
      );
      await confirmDelete.confirmDeletion();
    });
  });
}
