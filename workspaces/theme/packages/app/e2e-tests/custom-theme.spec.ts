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
import { ThemeVerifier } from './utils/theme-verifier';
import { ThemeConstants } from './utils/theme-constants';
import { TestUtils } from './utils/test-utils';
import { runAccessibilityTests } from './utils/acessibility';

test.describe('CustomTheme should be applied', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }) => {
    test.info().annotations.push({
      type: 'component',
      description: 'core',
    });
    testUtils = new TestUtils(page);
    await testUtils.loginAsGuest();
  });

  for (const theme of ThemeConstants.getThemes()) {
    test(`Verify ${theme.name} theme colors are applied and make screenshots`, async ({
      page,
    }, testInfo: TestInfo) => {
      const themeVerifier = new ThemeVerifier(page);

      if (theme.name === 'Light') {
        await runAccessibilityTests(
          page,
          testInfo,
          'accessibility-scan-results.json',
        );
      }

      await themeVerifier.setTheme(theme.name);
      await themeVerifier.takeScreenshotAndAttach(
        `screenshots/custom-theme-${theme.name}-inspection.png`,
        testInfo,
        `custom-theme-${theme.name}-inspection`,
      );
      await themeVerifier.verifyPrimaryColors(theme.primaryColor);
    });
  }

  test('Only Light and Dark themes are available', async ({ page }) => {
    await page
      .getByTestId('sidebar-root')
      .getByRole('link', { name: 'Settings' })
      .click();

    for (const themeName of ['Light', 'Dark']) {
      await expect(
        page.getByRole('button', { name: themeName, exact: true }),
      ).toBeVisible();
    }

    for (const themeName of [
      'RHDH Light (customized)',
      'RHDH Dark (customized)',
      'Backstage Light',
      'Backstage Dark',
    ]) {
      await expect(
        page.getByRole('button', { name: themeName, exact: true }),
      ).toHaveCount(0);
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
    await page.locator('nav').getByRole('link', { name: 'BCC tests' }).click();

    const themeNames = ['Dark', 'Light'];
    for (const themeName of themeNames) {
      await page.getByRole('button', { name: themeName, exact: true }).click();
      for (const [tab, subTabs] of Object.entries(tabs)) {
        await page.locator('nav').getByRole('link', { name: tab }).click();
        await runAccessibilityTests(
          page,
          testInfo,
          `${themeName}-${tab}-accessibility`,
        );
        for (const subTab of subTabs) {
          await page.getByText(subTab).click();
          await runAccessibilityTests(
            page,
            testInfo,
            `${themeName}-${tab}-${subTab}-accessibility`,
          );
        }
      }
    }
  });
});
