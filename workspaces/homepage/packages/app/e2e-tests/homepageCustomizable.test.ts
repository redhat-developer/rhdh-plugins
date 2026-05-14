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
    const loginUrl = process.env.APP_MODE === 'nfs' ? '/' : '/customizable';
    await testUtils.loginAsGuest(loginUrl);
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

  // Skipping as of now; re-enable after https://github.com/backstage/backstage/issues/33317 is fixed
  test.skip('Verify All Cards Can Be Resized in Edit Mode', async ({
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
    await homePageCustomization.addWidget('Onboarding');
    await expect(
      sharedPage.getByText(/Good (morning|afternoon|evening)/),
    ).toBeVisible();

    await homePageCustomization.addWidget('Access');
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
      const loginUrl = process.env.APP_MODE === 'nfs' ? '/' : '/customizable';
      await testUtils.loginAsGuest(loginUrl);
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

// ── Persona-based homepages ──────────────────────────────────────────────
//
// Three Backstage instances running in parallel:
// - Port 3000: guest  (`user:default/guest-user`, no groups)
// - Port 3001: admin  (`user:default/admin-user` in `group:default/admins`)
// - Port 3002: developer (`user:default/developer-user` in `group:default/developers`)

test.describe('Persona-Based Homepages', () => {
  test('Groups filters default widgets by persona', async ({ browser }) => {
    const loginUrl = process.env.APP_MODE === 'nfs' ? '/' : '/customizable';

    // Guest (port 3000, no groups): sees common defaults only
    const guestPage = await (
      await browser.newContext({ baseURL: 'http://localhost:3000' })
    ).newPage();
    const guestHome = new HomePageCustomization(guestPage);
    await new TestUtils(guestPage).loginAsGuest(loginUrl);
    await guestHome.verifyHomePageLoaded();

    await expect(
      guestPage.getByText(/Good (morning|afternoon|evening), Guest/),
    ).toBeVisible();
    await guestHome.verifyCardVisible('Explore Your Software Catalog');
    await guestHome.verifyCardVisible('Explore Templates');
    await guestHome.verifyCardVisible('Quick Access');
    await guestHome.verifyCardHidden('Featured docs');
    await guestHome.verifyCardHidden('Recently visited');

    // Admin (port 3001, group:default/admins): sees common + Featured Docs, Starred Entities
    const adminPage = await (
      await browser.newContext({ baseURL: 'http://localhost:3001' })
    ).newPage();
    const adminHome = new HomePageCustomization(adminPage);
    await new TestUtils(adminPage).loginAsGuest(loginUrl);
    await adminHome.verifyHomePageLoaded();

    await expect(
      adminPage.getByText(/Good (morning|afternoon|evening), Admin-user/),
    ).toBeVisible();
    await adminHome.verifyCardVisible('Explore Your Software Catalog');
    await adminHome.verifyCardVisible('Explore Templates');
    await adminHome.verifyCardVisible('Quick Access');
    await adminHome.verifyCardVisible('Featured docs');
    await adminHome.verifyCardHidden('Recently visited');

    // Developer (port 3002, group:default/developers): sees common + Recently Visited, Top Visited
    const devPage = await (
      await browser.newContext({ baseURL: 'http://localhost:3002' })
    ).newPage();
    const devHome = new HomePageCustomization(devPage);
    await new TestUtils(devPage).loginAsGuest(loginUrl);
    await devHome.verifyHomePageLoaded();

    await expect(
      devPage.getByText(/Good (morning|afternoon|evening), Developer-user/),
    ).toBeVisible();
    await devHome.verifyCardVisible('Explore Your Software Catalog');
    await devHome.verifyCardVisible('Explore Templates');
    await devHome.verifyCardVisible('Quick Access');
    await devHome.verifyCardVisible('Recently visited');
    await devHome.verifyCardHidden('Featured docs');
  });
});
