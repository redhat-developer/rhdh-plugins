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
 * “Add a document to Notebook” modal: staged files, browse picker, localized Add(n).
 */
export class NotebookAddDocumentModalPage {
  constructor(
    private readonly page: Page,
    private readonly t: LightspeedMessages,
  ) {}

  dialog(): Locator {
    return this.page.getByRole('dialog', {
      name: this.t['notebook.upload.modal.title'],
    });
  }

  modalTitleAccessibilityRegion(): Locator {
    return this.page.locator('#add-document-modal-title');
  }

  dragAndDropInstructions(): Locator {
    return this.dialog().getByText(
      this.t['notebook.upload.modal.dragDropTitle'],
    );
  }

  separatorBetweenDragZoneAndBrowse(): Locator {
    return this.dialog().getByText(this.t['notebook.upload.modal.separator'], {
      exact: true,
    });
  }

  browseFilesButton(): Locator {
    return this.dialog().getByRole('button', {
      name: this.t['notebook.upload.modal.browseButton'],
      exact: true,
    });
  }

  acceptedFileTypesParagraph(): Locator {
    return this.dialog().getByText(this.t['notebook.upload.modal.infoText'], {
      exact: true,
    });
  }

  addFilesButton(stagedCount: number): Locator {
    const label = substituteNotebookTemplate(
      this.t['notebook.upload.modal.addButton'],
      {
        count: stagedCount,
      },
    );
    return this.dialog().getByRole('button', { name: label });
  }

  cancelButton(): Locator {
    return this.dialog().getByRole('button', {
      name: this.t['modal.cancel'],
    });
  }

  /** Drop-zone copy, “or”, browse button, accepted file types paragraph. */
  async expectUploadAreaFullyDescribed(): Promise<void> {
    await expect(this.dragAndDropInstructions()).toBeVisible();
    await expect(this.separatorBetweenDragZoneAndBrowse()).toBeVisible();
    await expect(this.browseFilesButton()).toBeVisible();
    await expect(this.acceptedFileTypesParagraph()).toBeVisible();
  }

  async expectModalTitleBarMatchesAriaSnapshot(): Promise<void> {
    await expect(this.modalTitleAccessibilityRegion()).toMatchAriaSnapshot(`
      - heading :
        - heading "${this.t['notebook.upload.modal.title']}"
        - button "${this.t['modal.close']}"
      `);
  }

  async expectAddFilesButtonDisabled(stagedCount: number): Promise<void> {
    await expect(this.addFilesButton(stagedCount)).toBeDisabled();
  }

  async selectFilesViaBrowsePicker(filePaths: string[]): Promise<void> {
    const [fileChooser] = await Promise.all([
      this.page.waitForEvent('filechooser'),
      this.browseFilesButton().click(),
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
    await this.addFilesButton(stagedCount).click();
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton().click();
  }

  errorAlert(): Locator {
    return this.dialog().getByRole('alert');
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
