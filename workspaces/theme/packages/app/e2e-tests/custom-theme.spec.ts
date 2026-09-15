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
    );

    for (const theme of themes) {
      await themeVerifier.setTheme(theme.name);
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

  test('keeps the legacy Backstage Page grid when it contains BUI content', async ({
    page,
  }) => {
    await page
      .locator('nav')
      .getByRole('link', { name: 'MUI v5 tests' })
      .click();

    const legacyPage = page.locator('main[data-backstage-core-page]').first();
    await expect(legacyPage).toBeVisible();

    await legacyPage.evaluate(element => {
      const buiContent = document.createElement('div');
      buiContent.className = 'bui-Container-regression-test';
      element.appendChild(buiContent);
    });

    await expect(legacyPage).toHaveCSS('display', 'grid');
  });

  test('allows a classless BUI page to grow beyond the viewport', async ({
    page,
  }) => {
    const sidebarPage = page
      .locator('[class*="BackstageSidebarPage-root"]')
      .first();
    await expect(sidebarPage).toBeVisible();

    await sidebarPage.evaluate(element => {
      const main = document.createElement('main');
      main.dataset.testid = 'bui-page-layout';

      const container = document.createElement('div');
      container.className = 'bui-Container-regression-test';

      const spacer = document.createElement('div');
      spacer.style.height = '200vh';
      spacer.style.flex = '0 0 auto';

      main.append(container, spacer);
      element.appendChild(main);
    });

    const buiPage = page.getByTestId('bui-page-layout');
    await expect(buiPage).toBeVisible();
    await expect(buiPage).toHaveCSS('display', 'flex');
    await expect(buiPage).toHaveCSS('max-height', 'none');

    const minHeight = await buiPage.evaluate(element =>
      Number.parseFloat(getComputedStyle(element).minHeight),
    );
    expect(minHeight).toBeGreaterThan(0);

    const dimensions = await buiPage.evaluate(element => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    expect(dimensions.clientHeight).toBeGreaterThan(
      page.viewportSize()?.height ?? 0,
    );
    expect(dimensions.clientHeight).toBe(dimensions.scrollHeight);
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
