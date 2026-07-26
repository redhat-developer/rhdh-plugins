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

/** Page object for the delete-notebook confirmation modal on the grid. */
export class NotebookDeleteDialogPage {
  constructor(
    private readonly page: Page,
    private readonly t: LightspeedMessages,
    private readonly notebookDisplayName: string,
  ) {}

  /** Dialog anchored by visible notebook title (matches MUI `DeleteNotebookModal` content). */
  dialog(): Locator {
    return this.page
      .getByRole('dialog')
      .filter({ hasText: this.notebookDisplayName });
  }

  deleteNotebookConfirmButton(): Locator {
    return this.dialog().getByRole('button', {
      name: this.t['notebooks.delete.action'],
      exact: true,
    });
  }

  async expectDialogVisible(): Promise<void> {
    await expect(this.dialog()).toBeVisible();
  }

  async expectPermanentDeletionWarningText(): Promise<void> {
    await expect(this.dialog()).toContainText(
      this.t['notebooks.delete.message'],
    );
  }

  async confirmDeletion(): Promise<void> {
    await this.deleteNotebookConfirmButton().click();
  }
}
