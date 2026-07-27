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

/** Page object for rename notebook dialog opened from the notebooks grid. */
export class RenameNotebookModalPage {
  constructor(
    private readonly page: Page,
    private readonly t: LightspeedMessages,
    private readonly currentNotebookName: string,
  ) {}

  /** Resolved “Rename …?” title matching the notebook card heading. */
  expectedRenameDialogHeading(): string {
    return substituteNotebookTemplate(this.t['notebooks.rename.title'], {
      name: this.currentNotebookName,
    });
  }

  dialog(): Locator {
    return this.page.getByRole('dialog').filter({
      hasText: this.expectedRenameDialogHeading(),
    });
  }

  newNameTextbox(): Locator {
    return this.dialog().getByRole('textbox', {
      name: this.t['notebooks.rename.label'],
    });
  }

  submitRenameButton(): Locator {
    return this.dialog().getByRole('button', {
      name: this.t['notebooks.rename.action'],
    });
  }

  async expectDialogVisible(): Promise<void> {
    await expect(this.dialog()).toBeVisible();
  }

  async enterNewDisplayedNameAndSubmit(newName: string): Promise<void> {
    await this.newNameTextbox().fill(newName);
    await this.submitRenameButton().click();
  }
}
