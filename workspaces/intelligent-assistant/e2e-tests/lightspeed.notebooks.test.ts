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
  notebookTenFileStagingPaths,
  notebookUnsupportedTypeFixturePath,
} from './utils/notebooks';
import { substituteNotebookTemplate } from './utils/notebookTranslation';

const RENAMED_NOTEBOOK_TITLE = 'E2E Notebook Renamed';

test.describe('Intelligent assistant notebooks', () => {
  test.describe.configure({ mode: 'serial' });

  let sharedPage: Page;
  let translations: LightspeedMessages;
  let notebooks: NotebookSurfacePage;

  test.beforeAll(async ({ browser }) => {
    const boot = await bootstrapLightspeedE2ePage(browser);
    sharedPage = boot.page;
    translations = boot.translations;
    notebooks = new NotebookSurfacePage(sharedPage, translations, boot.locale);
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

  test('upload modal: title close button dismisses dialog', async () => {
    await notebooks.clickOpenUploadDocumentModal();
    const uploadModal = notebooks.uploadDocumentModal();
    await uploadModal.expectUploadAreaFullyDescribed();
    await uploadModal.clickTitleClose();
    await expect(uploadModal.dialog()).toBeHidden();
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

  test('document sidebar: rename document via click', async ({}, testInfo) => {
    const { absolutePath, fileName } = localeNotebookUpload1Path(
      testInfo.project.name,
    );

    await notebooks.clickOpenUploadDocumentModal();
    const uploadModal = notebooks.uploadDocumentModal();
    await uploadModal.selectFilesViaBrowsePicker([absolutePath]);
    await uploadModal.clickAddFilesForStagedCount(1);
    await notebooks.expectDocumentFileListedInSidebar(fileName);

    const baseName = fileName.replace(/\.[^.]+$/, '');
    const ext = fileName.slice(baseName.length);
    const newBaseName = `${baseName}-renamed`;
    const newFileName = `${newBaseName}${ext}`;

    await notebooks.renameDocumentInlineViaClick(fileName, newBaseName);
    await notebooks.expectDocumentFileListedInSidebar(newFileName);

    await notebooks.deleteFirstListedDocumentFromSidebarOverflowMenu();
  });

  test('document sidebar: rename document via kebab menu', async ({}, testInfo) => {
    const { absolutePath, fileName } = localeNotebookUpload1Path(
      testInfo.project.name,
    );

    await notebooks.clickOpenUploadDocumentModal();
    const uploadModal = notebooks.uploadDocumentModal();
    await uploadModal.selectFilesViaBrowsePicker([absolutePath]);
    await uploadModal.clickAddFilesForStagedCount(1);
    await notebooks.expectDocumentFileListedInSidebar(fileName);

    const baseName = fileName.replace(/\.[^.]+$/, '');
    const ext = fileName.slice(baseName.length);
    const newBaseName = `${baseName}-kebab`;
    const newFileName = `${newBaseName}${ext}`;

    await notebooks.renameDocumentViaKebabMenu(fileName, newBaseName);
    await notebooks.expectDocumentFileListedInSidebar(newFileName);

    await notebooks.deleteFirstListedDocumentFromSidebarOverflowMenu();
  });

  test('upload modal: eleven files rejected at cap', async () => {
    await notebooks.clickOpenUploadDocumentModal();
    const uploadModal = notebooks.uploadDocumentModal();
    await uploadModal.selectFilesViaBrowsePicker(
      notebookElevenFileStagingPaths(),
    );
    await expect(uploadModal.errorAlert()).toContainText(
      substituteNotebookTemplate(
        translations['notebook.upload.error.tooManyFiles'],
        { max: NOTEBOOK_SESSION_MAX_DOCUMENTS },
      ),
    );
    await uploadModal.clickCancel();
  });

  test('upload modal: dropzone disabled at ten staged files', async () => {
    await notebooks.clickOpenUploadDocumentModal();
    const uploadModal = notebooks.uploadDocumentModal();
    await uploadModal.selectFilesViaBrowsePicker(notebookTenFileStagingPaths());
    await uploadModal.expectStagedFileCountCaptionVisible(
      NOTEBOOK_SESSION_MAX_DOCUMENTS,
      NOTEBOOK_SESSION_MAX_DOCUMENTS,
    );
    await uploadModal.expectDropzoneDisabled();
    await uploadModal.expectMaxReachedTooltipOnDropzoneHover();
    await uploadModal.clickCancel();
  });

  test('upload modal: unsupported extension rejected', async () => {
    await notebooks.clickOpenUploadDocumentModal();
    const uploadModal = notebooks.uploadDocumentModal();
    await uploadModal.selectFilesViaBrowsePicker([
      notebookUnsupportedTypeFixturePath(),
    ]);
    await expect(uploadModal.errorAlert()).toContainText(
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
    await uploadModal.clickAddFilesForStagedCount(1);

    await expect(uploadModal.dialog()).toBeHidden({ timeout: 5_000 });
    const overwriteModal = notebooks.notebookOverwriteConfirmModal();
    await overwriteModal.expectDialogVisible();
    await expect(sharedPage.getByRole('dialog')).toHaveCount(1);
    await overwriteModal.expectListedOverwriteFile(fileName);
    await overwriteModal.clickBack();

    uploadModal = notebooks.uploadDocumentModal();
    await expect(uploadModal.dialog()).toBeVisible();
    await uploadModal.clickCancel();

    await notebooks.clickOpenUploadDocumentModal();
    uploadModal = notebooks.uploadDocumentModal();
    await uploadModal.selectFilesViaBrowsePicker([absolutePath]);
    await uploadModal.clickAddFilesForStagedCount(1);
    await expect(uploadModal.dialog()).toBeHidden({ timeout: 5_000 });
    await overwriteModal.expectDialogVisible();
    await overwriteModal.clickUpload();
    await expect(overwriteModal.dialog()).toBeHidden({ timeout: 30_000 });
    await notebooks.expectDocumentFileListedInSidebar(fileName);

    await notebooks.clickCloseNotebookEditor();
    await notebooks.deleteNotebookCardFromGrid(NOTEBOOK_UNTITLED_GRID_NAME);
  });

  test('notebook card: zero and singular resource counts', async ({}, testInfo) => {
    const { absolutePath, fileName } = localeNotebookUpload1Path(
      testInfo.project.name,
    );

    await notebooks.clickPrimaryNotebookCreate();
    const renamedName = 'Zero Docs Card';
    await notebooks.renameNotebookSidebarTitle(renamedName);
    await notebooks.clickCloseNotebookEditor();

    const renamedCard = notebooks.notebookCardByDisplayedName(renamedName);
    await notebooks.expectNotebookCardDisplayed(renamedName);
    await notebooks.expectNotebookCardShowsDocumentCount(renamedCard, 0);

    await renamedCard.click();
    await notebooks.clickOpenUploadDocumentModal();
    const uploadModal = notebooks.uploadDocumentModal();
    await uploadModal.selectFilesViaBrowsePicker([absolutePath]);
    await uploadModal.clickAddFilesForStagedCount(1);
    await notebooks.expectDocumentFileListedInSidebar(fileName);
    await notebooks.clickCloseNotebookEditor();

    await notebooks.expectNotebookCardShowsDocumentCount(
      notebooks.notebookCardByDisplayedName(renamedName),
      1,
    );
    await notebooks.deleteNotebookCardFromGrid(renamedName);
  });

  test('notebook card: overflow menu shows rename and delete icons', async () => {
    await notebooks.clickPrimaryNotebookCreate();
    const cardName = 'Menu Icons Card';
    await notebooks.renameNotebookSidebarTitle(cardName);
    await notebooks.clickCloseNotebookEditor();
    await notebooks.expectNotebookOverflowMenuShowsRenameAndDeleteWithIcons(
      notebooks.notebookCardByDisplayedName(cardName),
    );
    await notebooks.deleteNotebookCardFromGrid(cardName);
  });

  test('grid: close editor, rename, delete', async ({}, testInfo) => {
    const { absolutePath, fileName } = localeNotebookUpload1Path(
      testInfo.project.name,
    );

    await notebooks.clickPrimaryNotebookCreate();
    await notebooks.clickOpenUploadDocumentModal();
    const uploadModal = notebooks.uploadDocumentModal();
    await uploadModal.selectFilesViaBrowsePicker([absolutePath]);
    await uploadModal.clickAddFilesForStagedCount(1);
    await notebooks.expectDocumentFileListedInSidebar(fileName);
    await sharedPage.waitForTimeout(2000);

    const untitledBefore = await notebooks.untitledNotebookCards().count();

    await notebooks.clickCloseNotebookEditor();

    await notebooks.expectUntitledNotebookCardCount(untitledBefore + 1);
    await expect(notebooks.newestUntitledNotebookCard()).toBeVisible();

    await notebooks.expectNotebookListShowsDocumentCountSummaryAndUpdatedToday(
      1,
    );

    await notebooks.renameNotebookCardViaOverflowMenu(
      notebooks.newestUntitledNotebookCard(),
      RENAMED_NOTEBOOK_TITLE,
    );

    await notebooks.expectNotebookCardDisplayed(RENAMED_NOTEBOOK_TITLE);

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
  });

  test('grid: click card title triggers inline rename', async ({}, testInfo) => {
    const { absolutePath, fileName } = localeNotebookUpload1Path(
      testInfo.project.name,
    );

    await notebooks.clickPrimaryNotebookCreate();

    await notebooks.clickOpenUploadDocumentModal();
    const uploadModal = notebooks.uploadDocumentModal();
    await uploadModal.selectFilesViaBrowsePicker([absolutePath]);
    await uploadModal.clickAddFilesForStagedCount(1);
    await notebooks.expectDocumentFileListedInSidebar(fileName);

    await notebooks.clickCloseNotebookEditor();

    const card = notebooks.newestUntitledNotebookCard();
    await expect(card).toBeVisible();

    const newName = 'Click Renamed';
    await notebooks.renameNotebookCardViaTitleClick(card, newName);
    await notebooks.expectNotebookCardDisplayed(newName);
    await notebooks.deleteNotebookCardFromGrid(newName);
  });

  test('grid: Escape cancels inline rename', async ({}, testInfo) => {
    const { absolutePath, fileName } = localeNotebookUpload1Path(
      testInfo.project.name,
    );

    await notebooks.clickPrimaryNotebookCreate();

    await notebooks.clickOpenUploadDocumentModal();
    const uploadModal = notebooks.uploadDocumentModal();
    await uploadModal.selectFilesViaBrowsePicker([absolutePath]);
    await uploadModal.clickAddFilesForStagedCount(1);
    await notebooks.expectDocumentFileListedInSidebar(fileName);

    await notebooks.clickCloseNotebookEditor();

    const card = notebooks.newestUntitledNotebookCard();
    await expect(card).toBeVisible();

    await notebooks.startNotebookCardInlineRenameFromOverflow(card);
    await notebooks.fillNotebookCardInlineRename('Should Not Save');
    await notebooks.cancelNotebookCardInlineRenameWithEscape();

    await notebooks.expectNotebookCardInlineRenameInputHidden();
    await notebooks.expectNotebookCardDisplayed(NOTEBOOK_UNTITLED_GRID_NAME);
    await notebooks.expectNotebookCardAbsent('Should Not Save');
    await notebooks.deleteNotebookCardFromGrid(NOTEBOOK_UNTITLED_GRID_NAME);
  });

  test('grid: blur saves inline rename', async ({}, testInfo) => {
    const { absolutePath, fileName } = localeNotebookUpload1Path(
      testInfo.project.name,
    );

    await notebooks.clickPrimaryNotebookCreate();

    await notebooks.clickOpenUploadDocumentModal();
    const uploadModal = notebooks.uploadDocumentModal();
    await uploadModal.selectFilesViaBrowsePicker([absolutePath]);
    await uploadModal.clickAddFilesForStagedCount(1);
    await notebooks.expectDocumentFileListedInSidebar(fileName);

    await notebooks.clickCloseNotebookEditor();

    const card = notebooks.newestUntitledNotebookCard();
    await expect(card).toBeVisible();

    await notebooks.clickCardTitle(card);
    await notebooks.expectNotebookCardInlineRenameInputVisible();

    const newName = 'Blur Saved Name';
    await notebooks.saveNotebookCardInlineRenameWithBlur(newName);

    await notebooks.expectNotebookCardInlineRenameInputHidden();
    await notebooks.expectNotebookCardDisplayed(newName);
    await notebooks.deleteNotebookCardFromGrid(newName);
  });

  test('grid: empty or unchanged name cancels rename', async ({}, testInfo) => {
    const { absolutePath, fileName } = localeNotebookUpload1Path(
      testInfo.project.name,
    );

    await notebooks.clickPrimaryNotebookCreate();

    await notebooks.clickOpenUploadDocumentModal();
    const uploadModal = notebooks.uploadDocumentModal();
    await uploadModal.selectFilesViaBrowsePicker([absolutePath]);
    await uploadModal.clickAddFilesForStagedCount(1);
    await notebooks.expectDocumentFileListedInSidebar(fileName);

    await notebooks.clickCloseNotebookEditor();

    const card = notebooks.newestUntitledNotebookCard();
    await expect(card).toBeVisible();

    await notebooks.clickCardTitle(card);
    await notebooks.expectNotebookCardInlineRenameInputVisible();

    await notebooks.fillNotebookCardInlineRename('');
    await notebooks.commitNotebookCardInlineRename();

    await notebooks.expectNotebookCardInlineRenameInputHidden();
    await notebooks.expectNotebookCardDisplayed(NOTEBOOK_UNTITLED_GRID_NAME);

    await notebooks.clickCardTitle(notebooks.newestUntitledNotebookCard());
    await notebooks.expectNotebookCardInlineRenameInputVisible();
    await notebooks.commitNotebookCardInlineRename();

    await notebooks.expectNotebookCardInlineRenameInputHidden();
    await notebooks.expectNotebookCardDisplayed(NOTEBOOK_UNTITLED_GRID_NAME);
    await notebooks.deleteNotebookCardFromGrid(NOTEBOOK_UNTITLED_GRID_NAME);
  });

  test('sidebar: click title to rename inside editor', async () => {
    await notebooks.clickPrimaryNotebookCreate();

    await expect(notebooks.sidebarTitleText()).toBeVisible();

    const newName = 'Sidebar Renamed';
    await notebooks.renameNotebookSidebarTitle(newName);

    await notebooks.clickCloseNotebookEditor();
    await notebooks.expectNotebookCardDisplayed(newName);
    await notebooks.deleteNotebookCardFromGrid(newName);
  });

  test('auto-delete: empty untitled notebook is discarded on close', async () => {
    await notebooks.gotoFullscreenNotebooksTab();
    const cardsBefore = await notebooks.untitledNotebookCards().count();

    await notebooks.clickCreateNotebookFromEmptyList();
    await expect(sharedPage).toHaveURL(NOTEBOOK_EDITOR_URL_RE);

    await notebooks.clickCloseNotebookEditor();

    await notebooks.expectUntitledNotebookCardCount(cardsBefore);
  });

  test('auto-delete: notebook with uploaded file persists on close', async ({}, testInfo) => {
    const { absolutePath, fileName } = localeNotebookUpload1Path(
      testInfo.project.name,
    );
    const cardsBefore = await notebooks.untitledNotebookCards().count();

    await notebooks.clickCreateNotebookFromEmptyList();
    await expect(sharedPage).toHaveURL(NOTEBOOK_EDITOR_URL_RE);

    await notebooks.clickOpenUploadDocumentModal();
    const uploadModal = notebooks.uploadDocumentModal();
    await uploadModal.selectFilesViaBrowsePicker([absolutePath]);
    await uploadModal.clickAddFilesForStagedCount(1);
    await notebooks.expectDocumentFileListedInSidebar(fileName);
    await sharedPage.waitForTimeout(2000);

    await notebooks.clickCloseNotebookEditor();

    await notebooks.expectUntitledNotebookCardCount(cardsBefore + 1);

    await notebooks
      .notebookCardOverflowMenuButton(notebooks.newestUntitledNotebookCard())
      .click();
    await notebooks.deleteNotebookOverflowMenuItem().click();
    const confirmDelete = notebooks.notebookDeleteConfirmationDialog(
      NOTEBOOK_UNTITLED_GRID_NAME,
    );
    await confirmDelete.confirmDeletion();
    await notebooks.expectUntitledNotebookCardCount(cardsBefore);
  });

  test('auto-delete: renamed notebook persists on close', async () => {
    await notebooks.gotoFullscreenNotebooksTab();

    await notebooks.clickCreateNotebookFromEmptyList();
    await expect(sharedPage).toHaveURL(NOTEBOOK_EDITOR_URL_RE);

    const renamedName = 'Renamed Persists';
    await notebooks.renameNotebookSidebarTitle(renamedName);

    await notebooks.clickCloseNotebookEditor();

    await notebooks.expectNotebookCardDisplayed(renamedName);
    await notebooks.deleteNotebookCardFromGrid(renamedName);
  });
});
