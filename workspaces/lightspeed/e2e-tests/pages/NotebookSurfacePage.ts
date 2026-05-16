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

import { expect, type Locator, type Page } from '@playwright/test';

import type { LightspeedMessages } from '../utils/translations';
import { openLightspeed } from '../utils/testHelper';

import { NotebookAddDocumentModalPage } from './NotebookAddDocumentModalPage';
import { NotebookDeleteDialogPage } from './NotebookDeleteDialogPage';
import { NotebookOverwriteConfirmModalPage } from './NotebookOverwriteConfirmModalPage';
import { RenameNotebookModalPage } from './RenameNotebookModalPage';

/**
 * Display name for an untitled session on the grid (matches `UNTITLED_NOTEBOOK_NAME` from the plugin).
 */
export const NOTEBOOK_UNTITLED_GRID_NAME = 'Untitled Notebook';

/**
 * Developer Lightspeed **Notebooks** surface: fullscreen tab, notebook list/editor, sidebar, cards, modals.
 * Same role as {@link ./LightspeedPage.ts}: shared locators/assertions keep specs short.
 */
export class NotebookSurfacePage {
  constructor(
    private readonly page: Page,
    private readonly t: LightspeedMessages,
  ) {}

  /**
   * Scoped to the fullscreen chatbot region that contains notebooks (list + notebook editor).
   * Matches the landmark labeled “Chatbot” in the accessibility tree.
   */
  chatbotRegion(): Locator {
    return this.page.getByLabel('Chatbot', { exact: true });
  }

  async gotoFullscreenNotebooksTab(): Promise<void> {
    await openLightspeed(this.page);
    await this.page
      .getByRole('button', { name: this.t['aria.settings.label'] })
      .click();
    await this.page
      .getByRole('menuitem', {
        name: this.t['settings.displayMode.fullscreen'],
      })
      .click();
    await this.page
      .getByRole('tab', { name: this.t['tabs.notebooks'] })
      .click();
  }

  notebooksTab(): Locator {
    return this.page.getByRole('tab', { name: this.t['tabs.notebooks'] });
  }

  myNotebooksHeading(): Locator {
    return this.page.getByRole('heading', { name: this.t['notebooks.title'] });
  }

  createNotebookFromEmptyStateButton(): Locator {
    return this.page
      .getByRole('button', { name: this.t['notebooks.empty.action'] })
      .first();
  }

  /** Notebooks tab, “My Notebooks” heading, and primary create action are visible (empty listing). */
  async expectNotebookListHeaderControlsVisible(): Promise<void> {
    await expect(this.notebooksTab()).toBeVisible();
    await expect(this.myNotebooksHeading()).toBeVisible();
    await expect(this.createNotebookFromEmptyStateButton()).toBeVisible();
  }

  async expectEmptyNotebookListMatchesAriaSnapshot(): Promise<void> {
    await expect(this.chatbotRegion()).toMatchAriaSnapshot(`
    - heading "${this.t['notebooks.empty.title']}"
    - paragraph: ${this.t['notebooks.empty.description']}
    - button "${this.t['notebooks.empty.action']}"
    `);
  }

  async clickCreateNotebookFromEmptyList(): Promise<void> {
    await this.createNotebookFromEmptyStateButton().click();
  }

  /** Same label as empty-state create; first match is header when the grid is non-empty. */
  async clickPrimaryNotebookCreate(): Promise<void> {
    await this.page
      .getByRole('button', { name: this.t['notebooks.empty.action'] })
      .first()
      .click();
  }

  closeNotebookButton(): Locator {
    return this.page.getByRole('button', {
      name: this.t['notebook.view.close'],
    });
  }

  uploadResourceHeading(): Locator {
    return this.page.getByText(this.t['notebook.view.upload.heading'], {
      exact: true,
    });
  }

  uploadResourceActionButton(): Locator {
    return this.page.getByRole('button', {
      name: this.t['notebook.view.upload.action'],
    });
  }

  /** Composer stub while no documents are attached. */
  disabledComposerPlaceholder(): Locator {
    return this.chatbotRegion().getByRole('textbox', {
      name: this.t['notebook.view.input.placeholder'],
    });
  }

  sidebarCollapseButton(): Locator {
    return this.page.getByRole('button', {
      name: this.t['notebook.view.sidebar.collapse'],
    });
  }

  sidebarExpandButton(): Locator {
    return this.page.getByRole('button', {
      name: this.t['notebook.view.sidebar.expand'],
    });
  }

  sidebarAddDocumentButton(): Locator {
    return this.chatbotRegion()
      .getByRole('button', { name: this.t['notebook.view.documents.add'] })
      .first();
  }

  async clickOpenUploadDocumentModal(): Promise<void> {
    await this.sidebarAddDocumentButton().click();
  }

  /** Opens the upload flow for attaching documents to the current notebook. */
  uploadDocumentModal(): NotebookAddDocumentModalPage {
    return new NotebookAddDocumentModalPage(this.page, this.t);
  }

  notebookOverwriteConfirmModal(): NotebookOverwriteConfirmModalPage {
    return new NotebookOverwriteConfirmModalPage(this.page, this.t);
  }

  /**
   * Deleting from the notebooks list/card menu opens this confirmation (before session is removed).
   */
  notebookDeleteConfirmationDialog(
    notebookDisplayName: string,
  ): NotebookDeleteDialogPage {
    return new NotebookDeleteDialogPage(this.page, this.t, notebookDisplayName);
  }

  /** Shown after choosing Rename on a notebook card. `currentDisplayedName` is the title shown on that card. */
  renameNotebookDialog(
    currentDisplayedNotebookName: string,
  ): RenameNotebookModalPage {
    return new RenameNotebookModalPage(
      this.page,
      this.t,
      currentDisplayedNotebookName,
    );
  }

  /**
   * New notebook with no documents: upload prompts, disclaimer, disabled composer (+ tooltip when hovered), sidebar Add.
   */
  async expectNewNotebookEditorEmptyStateOnboarding(): Promise<void> {
    await expect(this.closeNotebookButton()).toBeVisible();
    await expect(this.uploadResourceHeading()).toBeVisible();
    await expect(this.uploadResourceActionButton()).toBeVisible();
    await expect(
      this.page.getByText(this.t['disclaimer.withValidation'], { exact: true }),
    ).toBeVisible();

    const disabledPrompt = this.disabledComposerPlaceholder();
    await expect(disabledPrompt).toBeDisabled();
    await disabledPrompt.locator('..').hover({ force: true });
    await expect(
      this.page.getByRole('tooltip', {
        name: this.t['notebook.view.input.disabledTooltip'],
      }),
    ).toBeVisible();

    await expect(this.sidebarCollapseButton()).toBeVisible();
    await expect(this.sidebarAddDocumentButton()).toBeVisible();
  }

  /** Document sidebar collapsed: expand visible, collapse hidden, Add still reachable. */
  async expectDocumentSidebarCollapsedState(): Promise<void> {
    await expect(this.sidebarExpandButton()).toBeVisible();
    await expect(this.sidebarCollapseButton()).toBeHidden();
    await expect(this.sidebarAddDocumentButton()).toBeVisible();
  }

  /** Collapse document sidebar, verify Add stays available, expand again to restore. */
  async collapseThenExpandDocumentSidebar(): Promise<void> {
    await expect(this.sidebarCollapseButton()).toBeVisible();
    await this.sidebarCollapseButton().click();
    await this.expectDocumentSidebarCollapsedState();
    await this.sidebarExpandButton().click();
    await expect(this.sidebarCollapseButton()).toBeVisible();
  }

  /** Kebab on the first document row in the sidebar list. */
  firstListedDocumentOverflowMenuToggle(): Locator {
    return this.chatbotRegion()
      .getByRole('button', {
        name: this.t['notebook.document.delete'],
        exact: true,
      })
      .first();
  }

  documentRowDeleteMenuItem(): Locator {
    return this.page.getByRole('menuitem', {
      name: this.t['notebook.document.delete'],
      exact: true,
    });
  }

  /** The confirmation dialog that appears after choosing Delete document. */
  deleteDocumentConfirmDialog(): Locator {
    return this.page.getByRole('dialog');
  }

  deleteDocumentConfirmButton(): Locator {
    return this.deleteDocumentConfirmDialog().getByRole('button', {
      name: this.t['notebook.document.delete.action'],
      exact: true,
    });
  }

  /** Opens the overflow menu on the first sidebar document, chooses Delete document, and confirms the deletion. */
  async deleteFirstListedDocumentFromSidebarOverflowMenu(): Promise<void> {
    await this.firstListedDocumentOverflowMenuToggle().click();
    await this.documentRowDeleteMenuItem().click();
    await expect(this.deleteDocumentConfirmDialog()).toBeVisible();
    await this.deleteDocumentConfirmButton().click();
  }

  async expectDocumentFileListedInSidebar(fileName: string): Promise<void> {
    await expect(
      this.chatbotRegion().getByText(fileName, { exact: true }).first(),
    ).toBeVisible({ timeout: 60_000 });
  }

  /**
   * Once the notebook reaches the attachment cap, sidebar Add is disabled (`DocumentSidebar.tsx`).
   */
  async expectSidebarDocumentsAddDisabled(): Promise<void> {
    await expect(this.sidebarAddDocumentButton()).toBeDisabled({
      timeout: 15_000,
    });
  }

  /** Waits until every uploaded title is visible (parallel uploads). */
  async expectDocumentTitlesListedInSidebar(
    fileNames: string[],
    options?: { timeout?: number },
  ): Promise<void> {
    const timeout = options?.timeout ?? 120_000;
    await Promise.all(
      fileNames.map(name =>
        expect(
          this.chatbotRegion().getByText(name, { exact: true }).first(),
        ).toBeVisible({ timeout }),
      ),
    );
  }

  /** Open the most recently listed Untitled Notebook card (`NotebookCard`). */
  async openUntitledNotebookFromGrid(): Promise<void> {
    const card = this.chatbotRegion()
      .locator('.pf-v6-c-card')
      .filter({ hasText: NOTEBOOK_UNTITLED_GRID_NAME })
      .last();
    await card.getByText(NOTEBOOK_UNTITLED_GRID_NAME, { exact: true }).click();
  }

  /** Shown again when no documents remain in the sidebar list. */
  async expectNotebookEditorUploadResourceButtonVisible(
    timeout = 5_000,
  ): Promise<void> {
    await expect(this.uploadResourceActionButton()).toBeVisible({ timeout });
  }

  /** Cards on “My notebooks” when session display name matches the backend default. */
  untitledNotebookCards(): Locator {
    return this.chatbotRegion()
      .locator('.pf-v6-c-card')
      .filter({ hasText: NOTEBOOK_UNTITLED_GRID_NAME });
  }

  newestUntitledNotebookCard(): Locator {
    return this.untitledNotebookCards().last();
  }

  /** Per-card overflow (…) that opens Rename / Delete on a notebook card. */
  notebookCardOverflowMenuButton(card: Locator): Locator {
    return card.getByRole('button', {
      name: this.t['aria.options.label'],
      exact: true,
    });
  }

  notebookCardByDisplayedName(notebookDisplayedName: string): Locator {
    return this.chatbotRegion()
      .locator('.pf-v6-c-card')
      .filter({ hasText: notebookDisplayedName })
      .first();
  }

  renameNotebookOverflowMenuItem(): Locator {
    return this.page.getByRole('menuitem', {
      name: this.t['notebooks.actions.rename'],
    });
  }

  deleteNotebookOverflowMenuItem(): Locator {
    return this.page.getByRole('menuitem', {
      name: this.t['notebooks.actions.delete'],
    });
  }

  /**
   * Shown on each card as count + plural label (same pattern as NotebookCard.tsx:
   * `{ document_count } { t('notebooks.documents') }`, not `notebook.view.documents.count`).
   */
  formatNotebookCardDocumentsSummary(documentCount: number): string {
    return `${documentCount} ${this.t['notebooks.documents']}`;
  }

  async expectUntitledNotebookCardCount(expected: number): Promise<void> {
    await expect(this.untitledNotebookCards()).toHaveCount(expected, {
      timeout: 5_000,
    });
  }

  async expectNotebookCardAbsent(notebookDisplayedName: string): Promise<void> {
    await expect(
      this.chatbotRegion()
        .locator('.pf-v6-c-card')
        .filter({ hasText: notebookDisplayedName }),
    ).toHaveCount(0, { timeout: 5_000 });
  }

  /** Closes the notebook editor and returns focus to “My notebooks” list view. */
  async clickCloseNotebookEditor(): Promise<void> {
    await this.closeNotebookButton().click();
  }

  /** After closing the editor, summary lines on cards include document count and “updated …” wording. */
  async expectNotebookListShowsDocumentCountSummaryAndUpdatedToday(
    documentCountOnCard = 0,
  ): Promise<void> {
    await expect(this.chatbotRegion()).toContainText(
      this.formatNotebookCardDocumentsSummary(documentCountOnCard),
    );
    await expect(this.chatbotRegion()).toContainText(
      this.t['notebooks.updated.today'],
    );
  }
}
