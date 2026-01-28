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

    // Switch locale for non-English projects
    const locale = await page.evaluate(() => globalThis.navigator.language);
    await switchToLocale(page, locale);
    translations = getTranslations(locale);
  });

  test('Access Quick start as Guest or Admin', async ({
    page,
  }, testInfo: TestInfo) => {
    await page.waitForTimeout(1000);

    await uiHelper.verifyText(translations.header.title);
    await uiHelper.verifyText(translations.header.subtitle);
    await uiHelper.verifyText(translations.footer.notStarted);

    await runAccessibilityTests(
      page,
      testInfo,
      'quick-start-accessibility.json',
      {
        skipViolationsAssert: true,
      },
    );

    // Click and verify setupAuthentication step
    const setupAuthStep = page.getByText(
      translations.steps.setupAuthentication.title,
    );
    await setupAuthStep.click();
    // Wait for the step content to be visible
    await page
      .getByText(translations.steps.setupAuthentication.description)
      .waitFor({ state: 'visible' });
    await uiHelper.verifyButtonURL(
      translations.steps.setupAuthentication.ctaTitle,
      'https://docs.redhat.com/en/documentation/red_hat_developer_hub/latest/html/authentication_in_red_hat_developer_hub/',
    );

    // Click and verify configureRbac step
    const configureRbacStep = page.getByText(
      translations.steps.configureRbac.title,
    );
    await configureRbacStep.click();
    await page
      .getByText(translations.steps.configureRbac.description)
      .waitFor({ state: 'visible' });
    await uiHelper.verifyButtonURL(
      translations.steps.configureRbac.ctaTitle,
      '/rbac',
    );

    // Click and verify configureGit step
    // This is critical: both setupAuthentication and configureGit have the same CTA text "En savoir plus" in French
    // So we need to ensure we're getting the button from the configureGit step, not the setupAuthentication step
    const configureGitStepTitle = page.getByText(
      translations.steps.configureGit.title,
    );
    await configureGitStepTitle.click();
    // Wait for the configureGit step description to be visible to ensure the step has expanded
    const configureGitDescription = page.getByText(
      translations.steps.configureGit.description,
    );
    await configureGitDescription.waitFor({ state: 'visible' });
    // Find the parent container (List) that contains both the description and the CTA
    // The structure is: List > ListItem (description) > ListItem (CTA)
    const parentList = configureGitDescription
      .locator('..') // ListItemText
      .locator('..') // ListItem
      .locator('..'); // List
    // Find the CTA button within this specific List container to avoid matching the setupAuthentication button
    const configureGitCta = parentList
      .getByRole('button', { name: translations.steps.configureGit.ctaTitle })
      .first();
    await configureGitCta.waitFor({ state: 'visible' });
    const href = await configureGitCta.getAttribute('href');
    expect(href).toContain(
      'https://docs.redhat.com/en/documentation/red_hat_developer_hub/latest/html/integrating_red_hat_developer_hub_with_github/',
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
