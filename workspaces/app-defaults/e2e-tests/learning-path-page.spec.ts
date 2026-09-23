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

import { expect, test } from '@playwright/test';

import { switchToLocale } from './utils/locale';
import { SidebarPage } from './utils/sidebar-page';
import { getLearningPathsTranslations } from './utils/translations';

test.describe('Learning Paths', () => {
  test.beforeEach(async ({ page, locale }) => {
    test.info().annotations.push({
      type: 'component',
      description: 'app-defaults',
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Enter' }).click();
    await switchToLocale(page, locale);
  });

  test('learning path cards link to external resources in a new tab', async ({
    page,
    locale,
  }) => {
    const sidebarPage = new SidebarPage(page, locale);
    const translations = getLearningPathsTranslations(locale);

    await sidebarPage.openLearningPaths();

    await expect(page).toHaveURL(/\/learning-paths\/?$/);
    await expect(
      page.locator('nav[aria-label="sidebar nav"]').getByRole('link', {
        name: translations.menuItem.learningPaths,
      }),
    ).toBeVisible();

    await sidebarPage.verifyLearningPathLinksOpenInNewTab();
  });
});
