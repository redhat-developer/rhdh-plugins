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
  localeNotebookUpload1Path,
  NOTEBOOK_EDITOR_URL_RE,
  NOTEBOOK_SESSION_MAX_DOCUMENTS,
  notebookElevenFileStagingPaths,
  notebookUnsupportedTypeFixturePath,
} from './utils/notebooks';
import { substituteNotebookTemplate } from './utils/notebookTranslation';

const RENAMED_NOTEBOOK_TITLE = 'E2E Notebook Renamed';

test.describe('Lightspeed notebooks', () => {
  test.describe.configure({ mode: 'serial' });

  let sharedPage: Page;
  let translations: LightspeedMessages;
  let notebooks: NotebookSurfacePage;

  test.beforeAll(async ({ browser }) => {
    const boot = await bootstrapLightspeedE2ePage(browser);
    sharedPage = boot.page;
    translations = boot.translations;
    notebooks = new NotebookSurfacePage(sharedPage, translations);
  });

  test('fullscreen list: header and empty state', async () => {
    await notebooks.gotoFullscreenNotebooksTab();
    await notebooks.expectNotebookListHeaderControlsVisible();
    await notebooks.expectEmptyNotebookListMatchesAriaSnapshot();
  });

  test('new notebook: editor onboarding', async () => {
    await notebooks.gotoFullscreenNotebooksTab();
    await notebooks.clickCreateNotebookFromEmptyList();
    await expect(sharedPage).toHaveURL(NOTEBOOK_EDITOR_URL_RE);
    await notebooks.expectNewNotebookEditorEmptyStateOnboarding();
  });

  test('upload modal: drop zone and disabled add', async () => {
    await notebooks.clickOpenUploadDocumentModal();
    const uploadModal = notebooks.uploadDocumentModal();

    await uploadModal.expectUploadAreaFullyDescribed();
    await uploadModal.expectModalTitleBarMatchesAriaSnapshot();
    await uploadModal.expectAddFilesButtonDisabled(0);
    await uploadModal.clickCancel();
  });

  test('document sidebar: collapse and expand', async () => {
    await notebooks.collapseThenExpandDocumentSidebar();
  });

  test('sidebar: add file then remove', async ({}, testInfo) => {
    const { absolutePath, fileName } = localeNotebookUpload1Path(
      testInfo.project.name,
    );

    await notebooks.clickOpenUploadDocumentModal();
    const uploadModal = notebooks.uploadDocumentModal();
    await uploadModal.selectFilesViaBrowsePicker([absolutePath]);

    await uploadModal.expectStagedFileCountCaptionVisible(
      1,
      NOTEBOOK_SESSION_MAX_DOCUMENTS,
    );
    await uploadModal.clickAddFilesForStagedCount(1);

    await notebooks.expectDocumentFileListedInSidebar(fileName);
    await notebooks.deleteFirstListedDocumentFromSidebarOverflowMenu();
    await notebooks.expectNotebookEditorUploadResourceButtonVisible();
  });

  test('upload modal: eleven files rejected at cap', async () => {
    await notebooks.clickOpenUploadDocumentModal();
    const uploadModal = notebooks.uploadDocumentModal();
    await uploadModal.selectFilesViaBrowsePicker(
      notebookElevenFileStagingPaths(),
    );
    await expect(uploadModal.dialog().getByRole('alert')).toContainText(
      substituteNotebookTemplate(
        translations['notebook.upload.error.tooManyFiles'],
        { max: NOTEBOOK_SESSION_MAX_DOCUMENTS },
      ),
    );
    await uploadModal.clickCancel();
  });

  test('upload modal: unsupported extension rejected', async () => {
    await notebooks.clickOpenUploadDocumentModal();
    const uploadModal = notebooks.uploadDocumentModal();
    await uploadModal.selectFilesViaBrowsePicker([
      notebookUnsupportedTypeFixturePath(),
    ]);
    await expect(uploadModal.dialog().getByRole('alert')).toContainText(
      translations['notebook.upload.error.unsupportedType'],
    );
    await uploadModal.clickCancel();
  });

  test('upload modal: duplicate file confirms overwrite then upload', async ({}, testInfo) => {
    const { absolutePath, fileName } = localeNotebookUpload1Path(
      testInfo.project.name,
    );

    await notebooks.clickOpenUploadDocumentModal();
    let uploadModal = notebooks.uploadDocumentModal();
    await uploadModal.selectFilesViaBrowsePicker([absolutePath]);
    await uploadModal.clickAddFilesForStagedCount(1);
    await notebooks.expectDocumentFileListedInSidebar(fileName);
    await sharedPage.waitForTimeout(1000);

    await notebooks.clickOpenUploadDocumentModal();
    uploadModal = notebooks.uploadDocumentModal();
    await uploadModal.selectFilesViaBrowsePicker([absolutePath]);

    const overwriteModal = notebooks.notebookOverwriteConfirmModal();
    await overwriteModal.expectDialogVisible();
    await overwriteModal.expectListedOverwriteFile(fileName);
    await overwriteModal.clickCancel();
    await sharedPage.waitForTimeout(200);
    await uploadModal.clickCancel();

    await notebooks.deleteFirstListedDocumentFromSidebarOverflowMenu();
    await notebooks.expectNotebookEditorUploadResourceButtonVisible();
  });

  test('grid: close editor, rename, delete', async () => {
    const untitledBefore = await notebooks.untitledNotebookCards().count();

    await notebooks.clickCloseNotebookEditor();

    await notebooks.expectUntitledNotebookCardCount(untitledBefore + 1);
    await expect(notebooks.newestUntitledNotebookCard()).toBeVisible();

    await notebooks.expectNotebookListShowsDocumentCountSummaryAndUpdatedToday(
      0,
    );

    await notebooks
      .notebookCardOverflowMenuButton(notebooks.newestUntitledNotebookCard())
      .click();
    await notebooks.renameNotebookOverflowMenuItem().click();

    const renameModal = notebooks.renameNotebookDialog(
      NOTEBOOK_UNTITLED_GRID_NAME,
    );
    await renameModal.enterNewDisplayedNameAndSubmit(RENAMED_NOTEBOOK_TITLE);

    await expect(sharedPage.getByText(RENAMED_NOTEBOOK_TITLE)).toBeVisible();

    await notebooks
      .notebookCardOverflowMenuButton(
        notebooks.notebookCardByDisplayedName(RENAMED_NOTEBOOK_TITLE),
      )
      .click();
    await notebooks.deleteNotebookOverflowMenuItem().click();

    const confirmDelete = notebooks.notebookDeleteConfirmationDialog(
      RENAMED_NOTEBOOK_TITLE,
    );
    await confirmDelete.expectDialogVisible();
    await confirmDelete.expectPermanentDeletionWarningText();
    await confirmDelete.confirmDeletion();

    await notebooks.expectNotebookCardAbsent(RENAMED_NOTEBOOK_TITLE);
    await notebooks.expectUntitledNotebookCardCount(untitledBefore);

    await expect(sharedPage.getByText(RENAMED_NOTEBOOK_TITLE)).toBeHidden();
  });
});
