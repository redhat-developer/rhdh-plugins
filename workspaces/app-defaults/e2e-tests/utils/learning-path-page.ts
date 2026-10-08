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

import { getE2eTranslations, E2eTranslations } from './translations';

export class LearningPathPage {
  private readonly translations: E2eTranslations;

  constructor(private readonly page: Page, locale = 'en') {
    this.translations = getE2eTranslations(locale);
  }

  async openLearningPaths(): Promise<void> {
    await this.page
      .locator('nav[aria-label="sidebar nav"]')
      .getByRole('link', {
        name: this.translations.learningPathTitle,
      })
      .click();

    await this.page.waitForURL(/\/learning-paths\/?$/);
  }

  async verifyLearningPathLinksOpenInNewTab(): Promise<void> {
    const learningPathLinks = this.page.locator('article').getByRole('link');

    await expect(learningPathLinks.first()).toBeVisible();

    for (const learningPathLink of await learningPathLinks.all()) {
      await expect(learningPathLink).toBeVisible();
      await expect(learningPathLink).toHaveAttribute('target', '_blank');
      await expect(learningPathLink).not.toHaveAttribute('href', '');
    }
  }
}
