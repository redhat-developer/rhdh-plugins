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
import { ThemeVerifier } from './utils/theme/theme-verifier';
import { ThemeConstants } from './utils/theme/theme-constants';
import { TestUtils } from './utils/theme/test-utils';
import { runAccessibilityTests } from './utils/theme/acessibility';

test.describe('CustomTheme should be applied', () => {
  let testUtils: TestUtils;

  test.beforeEach(async ({ page }, testInfo) => {
    test.info().annotations.push({
      type: 'component',
      description: 'app-defaults',
    });
    // Theme picker labels are English-only in these assertions.
    test.skip(
      testInfo.project.name !== 'en',
      'Theme e2e asserts English Light/Dark labels',
    );
    testUtils = new TestUtils(page);
    await testUtils.loginAsGuest();
  });

  for (const theme of ThemeConstants.getThemes()) {
    test(`Verify ${theme.name} theme colors are applied and make screenshots`, async ({
      page,
    }, testInfo: TestInfo) => {
      test.setTimeout(60_000);
      const themeVerifier = new ThemeVerifier(page);

      await themeVerifier.setTheme(theme.name);
      await runAccessibilityTests(
        page,
        testInfo,
        `${theme.name}-accessibility-scan-results.json`,
      );
      await themeVerifier.takeScreenshotAndAttach(
        `screenshots/custom-theme-${theme.name}-inspection.png`,
        testInfo,
        `custom-theme-${theme.name}-inspection`,
      );
      await themeVerifier.verifyPrimaryColors(theme.primaryColor);
    });
  }

  test('Only Light and Dark themes are available', async ({ page }) => {
    const themeVerifier = new ThemeVerifier(page);
    await themeVerifier.openSettings();

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
    await expect(page).toHaveTitle(/Scaffolded Backstage App/);
  });

  test('Verify Red Hat fonts are injected with webpack-resolved URLs', async ({
    page,
  }) => {
    const themeVerifier = new ThemeVerifier(page);
    await themeVerifier.verifyRedHatFontsInjected();
  });
});
