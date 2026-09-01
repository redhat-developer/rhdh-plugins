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

import { NotebookSurfacePage } from './pages/NotebookSurfacePage';
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
      notebooks = new NotebookSurfacePage(sharedPage, translations);
    });

    test('tabs are visible and notebooks tab selectable', async () => {
      await switchToCompactNotebooks(sharedPage, translations, mode);

      await expect(
        sharedPage.getByRole('tab', { name: translations['tabs.chat'] }),
      ).toBeVisible();
      const notebooksTab = sharedPage.getByRole('tab', {
        name: translations['tabs.notebooks'],
      });
      await expect(notebooksTab).toBeVisible();
      await expect(notebooksTab).toHaveAttribute('aria-selected', 'true');
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
      const header = sharedPage.locator('.pf-chatbot__header');

      await expect(
        header.getByRole('button', {
          name: translations['notebook.view.close'],
        }),
      ).toBeVisible();
      await expect(
        header.getByRole('button', {
          name: translations['notebook.view.documents.add'],
        }),
      ).toBeVisible();

      const collapseLabel = translations['notebook.view.sidebar.collapse'];
      const expandLabel = translations['notebook.view.sidebar.expand'];
      const sidebarToggle = header.getByRole('button', {
        name: new RegExp(`${collapseLabel}|${expandLabel}`),
      });
      await expect(sidebarToggle).toBeVisible();
    });

    test('NotebookView topBar close button hidden in compact mode', async () => {
      const closeButtons = sharedPage.getByRole('button', {
        name: translations['notebook.view.close'],
      });
      await expect(closeButtons).toHaveCount(1);
    });

    test('upload modal opens and renders within panel', async () => {
      const header = sharedPage.locator('.pf-chatbot__header');
      const addButton = header.getByRole('button', {
        name: translations['notebook.view.documents.add'],
      });
      await addButton.click();

      // In compact mode, disablePortal renders the MUI Dialog inline. The
      // ChatbotModal already has role="dialog", so scope to the MUI one.
      const dialog = sharedPage.locator(
        '[role="dialog"][aria-labelledby="add-document-modal-title"]',
      );
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.locator('#add-document-modal-title')).toBeVisible();
      await expect(
        dialog.locator(
          `text=${translations['notebook.upload.modal.dragDropTitle']}`,
        ),
      ).toBeVisible();

      await dialog
        .locator('button', { hasText: translations['modal.cancel'] })
        .click();
    });

    test('sidebar toggle mirrors icon direction', async () => {
      const header = sharedPage.locator('.pf-chatbot__header');
      const collapseLabel = translations['notebook.view.sidebar.collapse'];
      const expandLabel = translations['notebook.view.sidebar.expand'];

      const toggle = header.getByRole('button', {
        name: new RegExp(`${collapseLabel}|${expandLabel}`),
      });
      await expect(toggle).toBeVisible();

      const initialLabel = await toggle.getAttribute('aria-label');

      await toggle.click();
      await sharedPage.waitForTimeout(300);

      const newLabel = await toggle.getAttribute('aria-label');
      expect(newLabel).not.toBe(initialLabel);

      const expectedLabel =
        initialLabel === collapseLabel ? expandLabel : collapseLabel;
      expect(newLabel).toBe(expectedLabel);

      await toggle.click();
      await sharedPage.waitForTimeout(300);
      const restoredLabel = await toggle.getAttribute('aria-label');
      expect(restoredLabel).toBe(initialLabel);
    });

    test('file picker works in compact upload modal', async ({}, testInfo) => {
      const { absolutePath } = localeNotebookUpload1Path(testInfo.project.name);

      const header = sharedPage.locator('.pf-chatbot__header');
      await header
        .getByRole('button', {
          name: translations['notebook.view.documents.add'],
        })
        .click();

      const dialog = sharedPage.locator(
        '[role="dialog"][aria-labelledby="add-document-modal-title"]',
      );
      await expect(dialog).toBeVisible({ timeout: 10_000 });

      const fileInput = dialog.locator('input[type="file"]');
      await fileInput.setInputFiles([absolutePath]);

      const stagedCaption = translations['notebook.upload.modal.selectedFiles']
        .replace('{{count}}', '1')
        .replace('{{max}}', String(NOTEBOOK_SESSION_MAX_DOCUMENTS));
      await expect(dialog.locator(`text=${stagedCaption}`)).toBeVisible({
        timeout: 5_000,
      });

      await dialog
        .locator('button', { hasText: translations['modal.cancel'] })
        .click();
    });

    test('switch tabs preserves notebook state', async () => {
      await sharedPage
        .getByRole('tab', { name: translations['tabs.chat'] })
        .click();
      await expect(
        sharedPage.getByRole('tab', { name: translations['tabs.chat'] }),
      ).toHaveAttribute('aria-selected', 'true');

      await sharedPage
        .getByRole('tab', { name: translations['tabs.notebooks'] })
        .click();
      await expect(
        sharedPage.getByRole('tab', {
          name: translations['tabs.notebooks'],
        }),
      ).toHaveAttribute('aria-selected', 'true');

      // Notebook editor still shows (not reverted to list view)
      await expect(notebooks.uploadResourceHeading()).toBeVisible();
    });

    test('close notebook via header action', async () => {
      const header = sharedPage.locator('.pf-chatbot__header');
      await header
        .getByRole('button', {
          name: translations['notebook.view.close'],
        })
        .click();

      await expect(notebooks.myNotebooksHeading()).toBeVisible();
      // Empty notebooks (no uploaded documents) are auto-deleted on close
      await expect(
        notebooks.createNotebookFromEmptyStateButton(),
      ).toBeVisible();
    });

    test('display mode switch preserves notebooks tab', async () => {
      const otherMode: DisplayMode =
        mode === 'Overlay' ? 'Dock to window' : 'Overlay';

      await selectDisplayMode(sharedPage, translations, otherMode);

      await expect(
        sharedPage.getByRole('tab', {
          name: translations['tabs.notebooks'],
        }),
      ).toHaveAttribute('aria-selected', 'true');

      await expect(notebooks.myNotebooksHeading()).toBeVisible();
    });

    test('switch to fullscreen preserves notebooks tab', async () => {
      await selectDisplayMode(sharedPage, translations, 'Fullscreen');

      await expect(
        sharedPage.getByRole('tab', {
          name: translations['tabs.notebooks'],
        }),
      ).toBeVisible();
    });

    test('cleanup: delete created notebook', async () => {
      await selectDisplayMode(sharedPage, translations, mode);

      await expect(
        sharedPage.getByRole('tab', {
          name: translations['tabs.notebooks'],
        }),
      ).toBeVisible();
      await sharedPage
        .getByRole('tab', { name: translations['tabs.notebooks'] })
        .click();

      const card = notebooks.newestUntitledNotebookCard();
      if ((await card.count()) > 0) {
        await notebooks.notebookCardOverflowMenuButton(card).click();
        await notebooks.deleteNotebookOverflowMenuItem().click();
        const confirmDelete =
          notebooks.notebookDeleteConfirmationDialog('Untitled Notebook');
        await confirmDelete.confirmDeletion();
      }
    });
  });
}
