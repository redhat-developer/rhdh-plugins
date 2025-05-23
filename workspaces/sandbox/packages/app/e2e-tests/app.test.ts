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

import { test, expect, Page, type Locator } from '@playwright/test';
import { LoginPage } from '../Utils/loginPage';

const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env file

let page: Page;

// Load credentials and base URL from environment variables
const id = process.env.PLAYWRIGHT_ID!;
const pw = process.env.PLAYWRIGHT_PW!;
const baseUrl = process.env.BASE_URL!;

test.describe('sandbox plugin', () => {
  // Before all tests: launch browser, create new page, and log in
  test.beforeAll('', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1700, height: 940 }, // e.g. MacBook Pro screen resolution (CSS px)
    });
    page = await context.newPage();

    const login_page = new LoginPage(page);
    await login_page.navigate(baseUrl); // Navigate to base URL
    await login_page.login(id, pw); // Log in with credentials
  });

  // Test the homepage layout and welcome text
  test('Test Homepage', async () => {
    await page.locator('a').filter({ hasText: 'Home' }).isVisible();

    // Verify ARIA snapshot for the main article content
    await expect(page.getByRole('article')).toMatchAriaSnapshot(`
      - img "Red Hat Trial"
      - heading "Try Red Hat products" [level=1]
      - paragraph: Explore, experiment, and see what's possible
      - paragraph: /Click on "Try it" to initiate your free, no commitment \\d+-day trial\\./
    `);
  });

  // Test clicking the OpenShift card on the homepage
  test('Test Homepage Openshiftcard', async () => {
    const card = page.getByText('OpenShift Comprehensive cloud');
    await expect(card).toBeVisible(); // Ensure card is visible
    await card.getByRole('button', { name: 'Try it' }).click();
    // Verify expected text on the resulting article page
    await expect(page.getByRole('article')).toContainText('Welcome');
    await expect(page.getByRole('article')).toContainText(
      'Your free trial expires in 30 days',
    );
  });

  test('Test DevSandbox', async () => {
    // Try to click the 'Try it' button and wait for the popup
    const tryItButton = page.getByRole('button', { name: 'Try it' }).first();

    // Open the article in a new popup and wait for it to fully load
    const devSandboxPage = await clickAndWaitForPopup(page, tryItButton);
    // Wait for the new page's 'load' event to ensure it's completely loaded
    await devSandboxPage.waitForLoadState('load', { timeout: 30000 });
    // Wait for a specific element that should be visible after the page is fully loaded
    await devSandboxPage.waitForSelector('[class="pf-c-title pf-m-3xl"]', {
      state: 'visible',
      timeout: 15000,
    });
    await expect(devSandboxPage.getByRole('heading')).toContainText(
      'Log in with…',
    );
    await expect(devSandboxPage.getByRole('link')).toContainText('DevSandbox');
    await devSandboxPage.close();
  });

  // Test Activities page and open each article in a popup
  test('Test Activites_page', async () => {
    // Navigate to the Activities page
    await page.getByRole('link', { name: 'Activities' }).click();
    await expect(page.locator('h3')).toContainText('Featured');

    // Locate all article cards using shared class
    const articles = page.locator(
      '[class="v5-MuiCardContent-root css-g19dxr"]',
    );
    const no_of_artricles = await articles.count();
    if (no_of_artricles !== 0) {
      // Proceed only if there is at least one article on the page
      for (let index = 0; index < no_of_artricles; index++) {
        // Extract the title of each article card
        const article_ttl = await articles.nth(index).textContent();
        const title = extractTitle(article_ttl || '');
        // Open the article in a new popup and wait for it to fully load
        const popupPage = await clickAndWaitForPopup(page, articles.nth(index));
        // Assert the popup heading matches the expected article title
        await expect(popupPage.locator('h1')).toContainText(
          `Overview: ${title}`,
        );

        await popupPage.close();
      }
    }
  });
  function extractTitle(text: string): string {
    // Extracts everything up to the first lowercase letter followed by a capital (sentence break)
    return text
      .replace(/([a-z])(?=[A-Z])/g, '$1\n')
      .split('\n')[0]
      .trim();
  }
  async function clickAndWaitForPopup(currentPage: Page, elelocator: Locator) {
    const [popupPage] = await Promise.all([
      currentPage.waitForEvent('popup'),
      elelocator.click(),
    ]);
    return popupPage;
  }
});
