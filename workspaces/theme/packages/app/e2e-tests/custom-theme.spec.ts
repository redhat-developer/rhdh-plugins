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
import { test, TestInfo, expect } from '@playwright/test';
import { ThemeVerifier } from './theme-verifier';
import { ThemeConstants } from './theme-constants';
import { TestUtils } from './test-utils';
import { runAccessibilityTests } from './acessibility';

test.describe('CustomTheme should be applied', () => {
  let themeVerifier: ThemeVerifier;
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    test.info().annotations.push({
      type: 'component',
      description: 'core',
    });
    themeVerifier = new ThemeVerifier(page);
    testUtils = new TestUtils(page);
    await testUtils.loginAsGuest();
  });

  test('Verify theme colors are applied and make screenshots', async ({
    page,
  }, testInfo: TestInfo) => {
    const themes = ThemeConstants.getThemes();

    await runAccessibilityTests(
      page,
      testInfo,
      'accessibility-scan-results.json',
      { skipViolationsAssert: true },
    );

    for (const theme of themes) {
      await themeVerifier.setTheme(theme.name);
      await themeVerifier.verifyHeaderGradient(
        `linear-gradient(90deg, ${theme.headerColor1}, ${theme.headerColor2})`,
      );
      await themeVerifier.verifyBorderLeftColor(theme.navigationIndicatorColor);
      await themeVerifier.takeScreenshotAndAttach(
        `screenshots/custom-theme-${theme.name}-inspection.png`,
        testInfo,
        `custom-theme-${theme.name}-inspection`,
      );
      await themeVerifier.verifyPrimaryColors(theme.primaryColor);
    }
  });

  test('Verify that title for Backstage can be customized', async ({
    page,
  }) => {
    await expect(page).toHaveTitle(/My Company Catalog/);
  });

  test('Verify accessibility of the test pages', async ({
    page,
  }, testInfo: TestInfo) => {
    const tabs = {
      'BCC tests': ['Card Example'],
      'BUI tests': ['Table Example', 'Card Example'],
      'MUI v4 tests': ['Papers', 'Tabs', 'Grids', 'Inline styles'],
      'MUI v5 tests': ['Papers', 'Tabs', 'Grids', 'Inline styles'],
    };
    await page.getByRole('link', { name: 'BCC tests' }).click();

    const themeNames = ['RHDH Dark (latest)', 'RHDH Light (latest)'];
    for (const themeName of themeNames) {
      await page.getByRole('button', { name: themeName }).click();
      for (const [tab, subTabs] of Object.entries(tabs)) {
        await page.getByRole('link', { name: tab }).click();
        await runAccessibilityTests(
          page,
          testInfo,
          `${themeName}-${tab}-accessibility`,
          { skipViolationsAssert: true },
        );
        for (const subTab of subTabs) {
          await page.getByRole('tab', { name: subTab }).click();
          await runAccessibilityTests(
            page,
            testInfo,
            `${themeName}-${tab}-${subTab}-accessibility`,
            { skipViolationsAssert: true },
          );
        }
      }
    }
  });
});
