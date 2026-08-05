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

/**
 * "File already exists" confirmation when uploading a file whose name already exists in the notebook (`OverwriteConfirmModal.tsx`).
 */
export class NotebookOverwriteConfirmModalPage {
  constructor(
    private readonly page: Page,
    private readonly t: LightspeedMessages,
  ) {}

  dialog(): Locator {
    return this.page.getByRole('dialog').filter({
      has: this.page.getByRole('heading', {
        name: this.t['notebook.overwrite.modal.title'],
        level: 2,
      }),
    });
  }

  async expectDialogVisible(timeout = 15_000): Promise<void> {
    await expect(this.dialog()).toBeVisible({ timeout });
  }

  async clickBack(): Promise<void> {
    await this.dialog()
      .getByRole('button', {
        name: this.t['notebook.overwrite.modal.back'],
        exact: true,
      })
      .click();
  }

  async expectListedOverwriteFile(fileName: string): Promise<void> {
    await expect(
      this.dialog().getByText(fileName, { exact: true }),
    ).toBeVisible();
  }

  async clickUpload(): Promise<void> {
    await this.dialog()
      .getByRole('button', {
        name: /Upload|Hochladen|Subir|Charger|Carica|アップロード/i,
      })
      .click();
  }
}
