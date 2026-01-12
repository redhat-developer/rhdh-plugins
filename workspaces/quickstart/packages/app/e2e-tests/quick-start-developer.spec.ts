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
import { test, TestInfo } from '@playwright/test';
import { UIhelper, switchToLocale } from './utils/helper';
import { getTranslations, QuickstartMessages } from './utils/translations';
import { runAccessibilityTests } from './utils/accessibility';

test.describe('Test Quick Start plugin', () => {
  let uiHelper: UIhelper;
  let translations: QuickstartMessages;
  test.beforeEach(async ({ page }) => {
    test.info().annotations.push({
      type: 'component',
      description: 'plugins',
    });
    uiHelper = new UIhelper(page);

    await page.goto('/');
    await page.getByRole('button', { name: 'Enter' }).click();

    // Switch to French for French projects
    const projectName = test.info().project.name;
    if (projectName === 'fr' || projectName === 'dev-config-fr') {
      await switchToLocale(page, 'Français');
    }

    const currentLocale = await page.evaluate(
      () => globalThis.navigator.language.split('-')[0],
    );
    translations = getTranslations(currentLocale);
  });

  test('Access Quick start as User', async ({ page }, testInfo: TestInfo) => {
    // Wait for the page to be ready
    await page.waitForLoadState('domcontentloaded');

    // Wait for the quickstart drawer to be open (it adds a class to body when open)
    // If it's not open after a short wait, try to open it via the sidebar
    const drawerOpen = await page.evaluate(() => {
      return document.body.classList.contains('quickstart-drawer-open');
    });

    if (!drawerOpen) {
      // Drawer might not be open, try to open it via sidebar or wait for it
      try {
        const quickstartSidebarItem = page
          .locator('nav')
          .getByText('Quickstart');
        await quickstartSidebarItem.waitFor({
          state: 'visible',
          timeout: 5000,
        });
        await quickstartSidebarItem.click();
      } catch {
        // Sidebar item might not be available, wait for drawer to open automatically
        // This can happen if role detection is still in progress
      }

      // Wait for drawer to be open
      await page.waitForFunction(
        () => {
          return document.body.classList.contains('quickstart-drawer-open');
        },
        { timeout: 15000 },
      );
    }

    // Wait a bit more for the content to render
    await page.waitForTimeout(500);
    await uiHelper.verifyText(translations.header.title);
    await runAccessibilityTests(
      page,
      testInfo,
      'quick-start-user-accessibility.json',
      { skipViolationsAssert: true },
    );

    await uiHelper.verifyText(translations.header.subtitle);
    await page.getByText(translations.steps.importApplication.title).click();
    await uiHelper.verifyButtonURL(
      translations.steps.importApplication.ctaTitle,
      '/bulk-import/repositories',
    );
    await uiHelper.clickButtonByText(
      translations.steps.importApplication.ctaTitle,
      {
        exact: true,
      },
    );
    await page.getByText(translations.steps.learnAboutCatalog.title).click();
    await uiHelper.verifyButtonURL(
      translations.steps.learnAboutCatalog.ctaTitle,
      '/catalog',
    );
    await uiHelper.clickButtonByText(
      translations.steps.learnAboutCatalog.ctaTitle,
    );
    await uiHelper.verifyHeading('My Company Catalog');
    await page
      .getByText(translations.steps.exploreSelfServiceTemplates.title)
      .click();
    await uiHelper.verifyButtonURL(
      translations.steps.exploreSelfServiceTemplates.ctaTitle,
      '/create',
    );
    await uiHelper.clickButtonByText(
      translations.steps.exploreSelfServiceTemplates.ctaTitle,
    );
    await uiHelper.verifyHeading('Create a new component');
    await page.getByText(translations.steps.findAllLearningPaths.title).click();
    await uiHelper.verifyButtonURL(
      translations.steps.findAllLearningPaths.ctaTitle,
      '/learning-paths',
    );
    await uiHelper.clickButtonByText(
      translations.steps.findAllLearningPaths.ctaTitle,
    );
    const progress100Pattern = new RegExp(
      translations.footer.progress.replace('{{progress}}', '100'),
    );
    await uiHelper.verifyText(progress100Pattern);
  });
});
