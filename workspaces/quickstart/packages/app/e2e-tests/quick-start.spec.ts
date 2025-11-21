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
import { expect, test, Page, TestInfo } from '@playwright/test';
import { UIhelper } from './utils/helper';
import { getTranslations, QuickstartMessages } from './utils/translations';
import { runAccessibilityTests } from './utils/accessibility';

async function switchToLocale(page: Page, locale: string): Promise<void> {
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'English' }).click();
  await page.getByRole('option', { name: locale }).click();
  await page.locator('a').filter({ hasText: 'Home' }).click();
}

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

  test('Access Quick start as Guest or Admin', async ({
    page,
  }, testInfo: TestInfo) => {
    if (
      test.info().project.name === 'dev-config' ||
      test.info().project.name === 'dev-config-fr'
    ) {
      test.skip();
    }
    await page.waitForTimeout(1000);

    await uiHelper.verifyText(translations.header.title);
    await uiHelper.verifyText(translations.header.subtitle);
    await uiHelper.verifyText(translations.footer.notStarted);

    await runAccessibilityTests(page, testInfo, 'quick-start-accessibility', {
      skipViolationsAssert: true,
    });

    await page.getByText(translations.steps.setupAuthentication.title).click();
    await uiHelper.verifyButtonURL(
      translations.steps.setupAuthentication.ctaTitle,
      'https://docs.redhat.com/en/documentation/red_hat_developer_hub/latest/html/authentication_in_red_hat_developer_hub/',
      { exact: false },
    );
    await page.getByText(translations.steps.configureRbac.title).click();
    await uiHelper.verifyButtonURL(
      translations.steps.configureRbac.ctaTitle,
      '/rbac',
    );
    await page.getByText(translations.steps.configureGit.title).click();
    await uiHelper.verifyButtonURL(
      translations.steps.configureGit.ctaTitle,
      'https://docs.redhat.com/en/documentation/red_hat_developer_hub/latest/html/integrating_red_hat_developer_hub_with_github/',
      { exact: false },
    );
    await page.getByText(translations.steps.managePlugins.title).click();
    await uiHelper.verifyButtonURL(
      translations.steps.managePlugins.ctaTitle,
      '/extensions',
    );
    await uiHelper.clickButtonByText(translations.steps.managePlugins.ctaTitle);
    await expect(page).toHaveURL(/extensions/);
    const progressPattern = new RegExp(
      translations.footer.progress.replace('{{progress}}', '\\d+'),
    );
    await uiHelper.verifyText(progressPattern);
    await uiHelper.clickButtonByText(translations.footer.hide);
    await expect(
      page.getByRole('button', { name: translations.footer.hide }),
    ).toBeHidden();
  });

  test('Access Quick start as User', async ({ page }, testInfo: TestInfo) => {
    if (
      test.info().project.name === 'en' ||
      test.info().project.name === 'fr'
    ) {
      test.skip();
    }
    await page.waitForTimeout(1000);
    await uiHelper.verifyText(translations.header.title);
    await runAccessibilityTests(
      page,
      testInfo,
      'quick-start-user-accessibility',
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
