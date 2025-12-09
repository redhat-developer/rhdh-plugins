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

import { test, expect, BrowserContext, Page } from '@playwright/test';
import { TestUtils } from './utils/testUtils.js';
import { HomePageCustomization } from './pages/homePageCustomization.js';
import { runAccessibilityTests } from './utils/accessibility.js';

test.describe.serial('Dynamic Home Page Customization', () => {
  let testUtils: TestUtils;
  let homePageCustomization: HomePageCustomization;
  let sharedPage: Page;
  let sharedContext: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    testUtils = new TestUtils(sharedPage);
    homePageCustomization = new HomePageCustomization(sharedPage);
    await testUtils.loginAsGuest('/customizable');
  });

  test.afterAll(async () => {
    await sharedContext.close();
  });

  test('Verify Cards Display After Login', async ({
    browser: _browser,
  }, testInfo) => {
    await homePageCustomization.verifyHomePageLoaded();
    await homePageCustomization.verifyAllCardsDisplayed();
    await homePageCustomization.verifyEditButtonVisible();
    await runAccessibilityTests(sharedPage, testInfo);
  });

  test('Verify All Cards Can Be Resized in Edit Mode', async ({
    browser: _browser,
  }, testInfo) => {
    await homePageCustomization.enterEditMode();
    await runAccessibilityTests(sharedPage, testInfo);
    await homePageCustomization.resizeAllCards();
    await homePageCustomization.exitEditMode();
  });

  test('Verify Cards Can Be Individually Deleted in Edit Mode', async ({
    browser: _browser,
  }, testInfo) => {
    await homePageCustomization.enterEditMode();
    await homePageCustomization.deleteAllCards();
    await homePageCustomization.verifyCardsDeleted();
    await runAccessibilityTests(sharedPage, testInfo);
  });

  test('Verify Restore Default Cards', async ({
    browser: _browser,
  }, testInfo) => {
    await homePageCustomization.restoreDefaultCards();
    await homePageCustomization.verifyCardsRestored();
    await runAccessibilityTests(sharedPage, testInfo);
  });

  test('Verify All Cards can be Deleted with Clear all Button', async () => {
    await homePageCustomization.enterEditMode();
    await homePageCustomization.clearAllCardsWithButton();
    await homePageCustomization.verifyCardsDeleted();
  });

  test('Verify Add Widget Button Adds Cards', async () => {
    await homePageCustomization.addWidget('Red Hat Developer Hub - Onboarding');
    await expect(
      sharedPage.getByText(/Good (morning|afternoon|evening)/),
    ).toBeVisible();

    await homePageCustomization.addWidget(
      'Red Hat Developer Hub - Software Catalog',
    );
    await expect(
      sharedPage.getByText('Explore Your Software Catalog'),
    ).toBeVisible();

    await homePageCustomization.addWidget('Quick Access Card');
    await expect(sharedPage.getByText('Quick Access')).toBeVisible();

    await homePageCustomization.addWidget(
      'Red Hat Developer Hub - Explore templates',
    );
    await expect(sharedPage.getByText('Explore Templates')).toBeVisible();
  });
});
