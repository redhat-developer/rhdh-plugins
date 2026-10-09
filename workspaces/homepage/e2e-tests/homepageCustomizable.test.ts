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
    await testUtils.loginAsGuest();
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
    await homePageCustomization.restoreDefaultWidgets();
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

    await homePageCustomization.addWidget('Quick Access');
    await expect(sharedPage.getByText('Quick Access')).toBeVisible();
  });

  // ── Persistent storage ────────────────────────────────────────────────

  test.describe('Persistent storage', () => {
    test('Customizations persist across page reload', async () => {
      await homePageCustomization.deleteFirstCard();
      await homePageCustomization.exitEditMode();
      const countBeforeReload =
        await homePageCustomization.getVisibleCardCount();
      expect(countBeforeReload).toBeGreaterThan(0);

      await sharedPage.reload();
      await homePageCustomization.verifyCardHidden(
        'Good (morning|afternoon|evening)',
      );
      await homePageCustomization.verifyCardVisible('Quick Access');
      const countAfterReload =
        await homePageCustomization.getVisibleCardCount();
      expect(countAfterReload).toBe(countBeforeReload);
    });

    test('Customizations persist across sign-out and re-login', async () => {
      const countBeforeLogout =
        await homePageCustomization.getVisibleCardCount();
      expect(countBeforeLogout).toBeGreaterThan(0);

      await testUtils.signOut();
      await testUtils.loginAsGuest();
      await homePageCustomization.verifyCardHidden(
        'Good (morning|afternoon|evening)',
      );
      await homePageCustomization.verifyCardVisible('Quick Access');
      const countAfterLogout =
        await homePageCustomization.getVisibleCardCount();
      expect(countAfterLogout).toBe(countBeforeLogout);
    });
  });
});
