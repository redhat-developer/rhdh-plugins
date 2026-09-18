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

import { expect, Page } from '@playwright/test';

import {
  getLearningPathsTranslations,
  LearningPathsE2eMessages,
} from './translations';

export class SidebarPage {
  private readonly translations: LearningPathsE2eMessages;

  constructor(private readonly page: Page, locale = 'en') {
    this.translations = getLearningPathsTranslations(locale);
  }

  async openLearningPaths(): Promise<void> {
    await this.page
      .getByRole('navigation', { name: 'sidebar nav' })
      .getByRole('link', {
        name: this.translations.menuItem.learningPaths,
      })
      .click();

    await this.page.waitForURL(/\/learning-paths\/?$/);
  }

  async verifyLearningPathLinksOpenInNewTab(): Promise<void> {
    const learningPathLinks = this.page.getByRole('article').getByRole('link');

    await expect(learningPathLinks.first()).toBeVisible({ timeout: 20_000 });

    for (const learningPathLink of await learningPathLinks.all()) {
      await expect(learningPathLink).toBeVisible();
      await expect(learningPathLink).toHaveAttribute('target', '_blank');
      await expect(learningPathLink).not.toHaveAttribute('href', '');
    }
  }
}
