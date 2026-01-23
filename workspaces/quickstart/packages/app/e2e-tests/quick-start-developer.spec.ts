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

    // Switch locale for non-English projects
    const locale = await page.evaluate(() => globalThis.navigator.language);
    await switchToLocale(page, locale);
    translations = getTranslations(locale);
  });

  test('Access Quick start as User', async ({ page }, testInfo: TestInfo) => {
    // Wait for the page to be ready
    await page.waitForLoadState('domcontentloaded');

    // Try to wait for the header text directly first (drawer might already be open)
    // This is more reliable than checking for the class
    try {
      await page
        .getByText(translations.header.title, { exact: true })
        .waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      // Header not visible, try to open the drawer
      // First, check if drawer is already open via class
      const drawerOpen = await page.evaluate(() => {
        return document.body.classList.contains('docked-drawer-open');
      });

      if (!drawerOpen) {
        // Try to open via sidebar
        try {
          const quickstartSidebarItem = page
            .locator('nav')
            .getByText('Quickstart');
          await quickstartSidebarItem.waitFor({
            state: 'visible',
            timeout: 5000,
          });
          await quickstartSidebarItem.click();
          // Wait for header to appear after clicking
          await page
            .getByText(translations.header.title, { exact: true })
            .waitFor({ state: 'visible', timeout: 10000 });
        } catch {
          // Sidebar item not available, try help menu button
          try {
            // Look for Quickstart button in help menu
            const helpButton = page.getByRole('button', { name: /help|menu/i });
            if (await helpButton.isVisible({ timeout: 3000 })) {
              await helpButton.click();
              const quickstartMenuItem = page.getByText('Quick start');
              await quickstartMenuItem.waitFor({
                state: 'visible',
                timeout: 3000,
              });
              await quickstartMenuItem.click();
              await page
                .getByText(translations.header.title, { exact: true })
                .waitFor({ state: 'visible', timeout: 10000 });
            }
          } catch {
            // If all else fails, wait for drawer to open automatically
            // This might happen if role detection is still in progress
            await page
              .getByText(translations.header.title, { exact: true })
              .waitFor({ state: 'visible', timeout: 15000 });
          }
        }
      } else {
        // Drawer class says it's open, but content might not be rendered yet
        await page
          .getByText(translations.header.title, { exact: true })
          .waitFor({ state: 'visible', timeout: 10000 });
      }
    }

    // Verify the header is visible
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
