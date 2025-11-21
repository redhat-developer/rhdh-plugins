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
import { expect, test, TestInfo } from '@playwright/test';
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

  test('Access Quick start as Guest or Admin', async ({
    page,
  }, testInfo: TestInfo) => {
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
});
