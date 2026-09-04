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
import { substituteNotebookTemplate } from '../utils/notebookTranslation';

/**
 * “Add a resource to Notebook” modal: staged files, browse picker, localized Add(n).
 */
export class NotebookAddDocumentModalPage {
  constructor(
    private readonly page: Page,
    private readonly t: LightspeedMessages,
  ) {}

  dialog(): Locator {
    return this.page
      .locator('[role="dialog"][aria-labelledby="add-document-modal-title"]')
      .filter({ hasText: this.t['notebook.upload.modal.dragDropTitle'] });
  }

  modalTitleAccessibilityRegion(): Locator {
    return this.dialog()
      .locator('h2')
      .filter({ hasText: this.t['notebook.upload.modal.title'] })
      .first();
  }

  dragAndDropInstructions(): Locator {
    return this.dialog().getByText(
      this.t['notebook.upload.modal.dragDropTitle'],
    );
  }

  supportedFormatsLabel(): Locator {
    return this.dialog().getByText(
      this.t['notebook.upload.modal.supportedFormats'],
    );
  }

  maxFileSizeText(): Locator {
    return this.dialog().getByText(this.t['notebook.upload.modal.maxFileSize']);
  }

  addFilesButton(stagedCount: number): Locator {
    const label =
      stagedCount > 0
        ? substituteNotebookTemplate(
            this.t['notebook.upload.modal.addButton'],
            { count: stagedCount },
          )
        : this.t['notebook.upload.modal.addButtonEmpty'];
    return this.dialog().locator('button', { hasText: label, exact: true });
  }

  cancelButton(): Locator {
    return this.dialog().locator('button', {
      hasText: this.t['common.cancel'],
      exact: true,
    });
  }

  /** Drop-zone copy, “or”, browse button, accepted file types paragraph. */
  async expectUploadAreaFullyDescribed(): Promise<void> {
    await expect(this.dragAndDropInstructions()).toBeVisible();
    await expect(this.supportedFormatsLabel()).toBeVisible();
    await expect(this.maxFileSizeText()).toBeVisible();
    await this.expectSupportedFileTypeChipsVisible();
  }

  async expectSupportedFileTypeChipsVisible(): Promise<void> {
    for (const label of ['TXT', 'MD', 'PDF', 'JSON', 'YAML', 'LOG']) {
      await expect(
        this.dialog().getByText(label, { exact: true }),
      ).toBeVisible();
    }
  }

  titleCloseButton(): Locator {
    return this.dialog().locator(
      `button[aria-label="${this.t['common.close']}"]`,
    );
  }

  async clickTitleClose(): Promise<void> {
    const close = this.titleCloseButton();
    await close.scrollIntoViewIfNeeded();
    await close.click({ force: true });
  }

  async dismiss(): Promise<void> {
    const cancel = this.cancelButton();
    await cancel.scrollIntoViewIfNeeded();
    await cancel.click({ force: true });
    await expect(this.dialog()).toBeHidden({ timeout: 10_000 });
  }

  dropzoneClickArea(): Locator {
    return this.dialog().getByRole('button', {
      name: this.t['notebook.upload.modal.dragDropTitle'],
    });
  }

  async expectDropzoneDisabled(): Promise<void> {
    await expect(this.dropzoneClickArea()).toHaveAttribute('tabindex', '-1');
  }

  async expectMaxReachedTooltipOnDropzoneHover(): Promise<void> {
    await this.dropzoneClickArea().hover({ force: true });
    await expect(
      this.page.getByRole('tooltip', {
        name: this.t['notebook.view.documents.maxReached'],
      }),
    ).toBeVisible();
  }

  async expectModalTitleBarMatchesAriaSnapshot(): Promise<void> {
    await expect(this.modalTitleAccessibilityRegion()).toBeVisible();
    await expect(this.titleCloseButton()).toBeVisible();
  }

  async expectAddFilesButtonDisabled(stagedCount: number): Promise<void> {
    await expect(this.addFilesButton(stagedCount)).toBeDisabled();
  }

  async selectFilesViaBrowsePicker(filePaths: string[]): Promise<void> {
    const [fileChooser] = await Promise.all([
      this.page.waitForEvent('filechooser'),
      this.dragAndDropInstructions().click(),
    ]);
    await fileChooser.setFiles(filePaths);
  }

  async expectStagedFileCountCaptionVisible(
    stagedCount: number,
    maxSelectable: number,
  ): Promise<void> {
    const caption = substituteNotebookTemplate(
      this.t['notebook.upload.modal.selectedFiles'],
      {
        count: stagedCount,
        max: maxSelectable,
      },
    );
    await expect(
      this.dialog().getByText(caption, { exact: true }),
    ).toBeVisible();
  }

  async clickAddFilesForStagedCount(stagedCount: number): Promise<void> {
    const button = this.addFilesButton(stagedCount);
    await button.scrollIntoViewIfNeeded();
    await button.click({ force: true });
  }

  async clickCancel(): Promise<void> {
    await this.dismiss();
  }

  errorAlert(): Locator {
    return this.dialog().locator('[data-ouia-component-type="PF6/Alert"]');
  }

  async expectValidationAlertsInclude(text: string): Promise<void> {
    await expect(this.errorAlert()).toContainText(text);
  }

  /** `notebook.upload.error.tooManyFiles` with `{{max}}` interpolated (matches `AddDocumentModal.tsx`). */
  formatTooManyFilesMessage(maxFiles: number): string {
    return substituteNotebookTemplate(
      this.t['notebook.upload.error.tooManyFiles'],
      { max: maxFiles },
    );
  }

  async expectTooManyFilesValidation(maxFiles: number): Promise<void> {
    await this.expectValidationAlertsInclude(
      this.formatTooManyFilesMessage(maxFiles),
    );
  }

  async expectUnsupportedTypeValidation(): Promise<void> {
    await this.expectValidationAlertsInclude(
      this.t['notebook.upload.error.unsupportedType'],
    );
  }
}
