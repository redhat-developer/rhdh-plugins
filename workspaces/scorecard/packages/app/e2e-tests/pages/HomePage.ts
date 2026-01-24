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

import { Page, expect } from '@playwright/test';
import { ScorecardMessages } from '../utils/translationUtils';

export class HomePage {
  readonly page: Page;
  readonly translations: ScorecardMessages;

  constructor(page: Page, translations: ScorecardMessages) {
    this.page = page;
    this.translations = translations;
  }

  async navigateToHome() {
    await this.page.getByRole('link', { name: 'Home' }).first().click();
  }

  async enterEditMode() {
    await this.page.getByRole('button', { name: 'Edit' }).click();
  }

  async clearAllWidgets() {
    await this.page.getByRole('button', { name: 'Clear all' }).click();
  }

  async addWidget(widgetName: string) {
    await this.page.getByRole('button', { name: 'Add widget' }).click();
    await this.page.getByRole('button', { name: widgetName }).click();
  }

  async saveChanges() {
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  async expectWidgetVisible(metricId: 'github.open_prs' | 'jira.open_issues') {
    await expect(
      this.page.getByText(this.translations.metric[metricId].title),
    ).toBeVisible();
  }

  async expectWidgetNotVisible(
    metricId: 'github.open_prs' | 'jira.open_issues',
  ) {
    await expect(
      this.page.getByText(this.translations.metric[metricId].title),
    ).not.toBeVisible();
  }
}
