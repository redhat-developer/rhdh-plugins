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

import { test, expect } from '@playwright/test';
import { TestUtils } from './utils/test-utils.js';
import { HomePageCustomization } from './pages/home-page-customization.js';
import { runAccessibilityTests } from './utils/accessibility.js';

test.describe.serial('Dynamic Home Page Customization', () => {
  let testUtils: TestUtils;
  let homePageCustomization: HomePageCustomization;

  test.beforeAll(async () => {
    test.info().annotations.push({
      type: 'component',
      description: 'core',
    });
  });

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    homePageCustomization = new HomePageCustomization(page);
    await testUtils.loginAsGuest();
  });

  test('Verify Cards Display After Login', async ({ page }, testInfo) => {
    await homePageCustomization.verifyHomePageLoaded();
    await homePageCustomization.verifyAllCardsDisplayed();
    await homePageCustomization.verifyEditButtonVisible();
    await runAccessibilityTests(page, testInfo);
  });

  test('Verify All Cards Can Be Resized in Edit Mode', async ({
    page,
  }, testInfo) => {
    await homePageCustomization.enterEditMode();
    await runAccessibilityTests(page, testInfo);
    await homePageCustomization.resizeAllCards();
    await homePageCustomization.exitEditMode();
  });

  test('Verify Cards Can Be Individually Deleted in Edit Mode', async ({
    page,
  }, testInfo) => {
    await homePageCustomization.enterEditMode();
    await homePageCustomization.deleteAllCards();
    await homePageCustomization.verifyCardsDeleted();
    await runAccessibilityTests(page, testInfo);
  });

  test('Verify Restore Default Cards', async ({ page }, testInfo) => {
    await homePageCustomization.enterEditMode();
    await homePageCustomization.restoreDefaultCards();
    await homePageCustomization.verifyCardsRestored();
    await runAccessibilityTests(page, testInfo);
  });

  test('Verify Clear All Button Deletes Cards and Add Widget Button Adds Cards', async ({
    page,
  }, testInfo) => {
    // Verify Clear All Button Deletes Cards
    await homePageCustomization.enterEditMode();
    await homePageCustomization.clearAllCardsWithButton();
    await homePageCustomization.verifyCardsDeleted();
    await runAccessibilityTests(page, testInfo);

    // Verify Add Widget Button Adds Cards
    await homePageCustomization.addWidget('OnboardingSection');
    await expect(
      page.getByText(/Good (morning|afternoon|evening)/),
    ).toBeVisible();

    await homePageCustomization.addWidget('EntitySection');
    await expect(page.getByText('Explore Your Software Catalog')).toBeVisible();

    await homePageCustomization.addWidget('QuickAccessCard');
    await expect(page.getByText('Quick Access')).toBeVisible();

    await homePageCustomization.addWidget('TemplateSection');
    await expect(page.getByText('Explore Templates')).toBeVisible();
  });
});
